/* eslint-disable camelcase, @typescript-eslint/camelcase */

import { promises as fs } from 'fs';

import { AsnConvert, OctetString } from '@peculiar/asn1-schema';
import {
  AuthorityKeyIdentifier,
  CRLNumber,
  CertificateList,
  Extension,
  GeneralName,
  Name,
  RevokedCertificate,
  TBSCertList,
  Time,
  Version,
  id_ce_authorityKeyIdentifier,
  id_ce_cRLNumber,
} from '@peculiar/asn1-x509';
import {
  AuthorityKeyIdentifierExtension,
  EcAlgorithm,
  Extension as X509Extension,
} from '@peculiar/x509';
import { add } from 'date-fns';

import crypto from '../crypto';
import { ecdsaBERToWebSig, ecdsaWebSigToBER } from '../ext/EcdsaSig';
import { numberToBuffer } from '../utils';
import Certificate from './Certificate';
import State, { readSerialNumber } from './State';

function asAki(ext: X509Extension | undefined): AuthorityKeyIdentifierExtension | undefined {
  if (ext instanceof AuthorityKeyIdentifierExtension) return ext;
  return undefined;
}

export default class Crl {
  private path: string;
  private key: CryptoKey;

  constructor(path: string, key: CryptoKey) {
    this.path = path;
    this.key = key;
  }

  /** @internal public only for CA use, do not use directly */
  public static async fromState(
    path: string,
    key: CryptoKey,
    ca: Certificate,
    state: State,
  ): Promise<Crl> {
    const revokedCerts = await state.revokedCertificates();

    const signatureAlgorithm = new EcAlgorithm().toAsnAlgorithm(ca.x509.signatureAlgorithm);
    if (!signatureAlgorithm) throw new Error('Unsupported signature algorithm');

    // annoyingly this is the only way to get back the original from the x509 lib
    const issuer = AsnConvert.parse(ca.x509.subjectName.toArrayBuffer(), Name);

    const now = new Date();
    const next = add(now, { days: 90 });

    const serial = readSerialNumber(await state.nextCrlSerial());

    const revokedCertificates = revokedCerts.length
      ? revokedCerts.map(
          (cert) =>
            new RevokedCertificate({
              // rome-ignore lint/style/noNonNullAssertion: always exists here
              revocationDate: new Time(cert.revocationDate!),
              userCertificate: cert.serial,
            }),
        )
      : undefined;

    // Doc 9303-12 defines the CRL profile in §7.1.4:
    // - Version 2
    // - Signature algo on the tbsCertList and outer CertList must match
    // - revoked cert list cannot be empty — if there's no certs, don't include the field
    //   - revoked cert entries must not themselves have any extensions
    //     (e.g. reasonCode, holdInstructionCode, etc)
    // - issuer must at least have the country name, and optionally the serial
    // - extensions must be present and have:
    //   - AuthorityKeyIdentifier, non-critical, same as the CSCA's SKI (required)
    //     - containing the key identifier of the CSCA's public key (required)
    //     - and its DN as the `issuer` field (optional)
    //     - and its serial number (optional)
    //   - IssuerAltName, non-critical, only in the case of CSCA name change
    //   - CRLNumber, non-critical, in minimal padding format (required)
    //   - no other extensions
    //   - note: unlike the Cert, we're building the CRL with the asn1-x509 lib,
    //     so it's not at all the same API >:(

    const keyIdentifier = asAki(
      ca.x509.extensions.find((ext) => ext.type === id_ce_authorityKeyIdentifier),
    )?.keyId;
    if (!keyIdentifier) throw new Error('CSCA missing AuthorityKeyIdentifier extension');

    const crlAki = new Extension({
      critical: false,
      extnID: id_ce_authorityKeyIdentifier,
      extnValue: new OctetString(
        AsnConvert.serialize(
          new AuthorityKeyIdentifier({
            keyIdentifier: new OctetString(Buffer.from(keyIdentifier, 'hex')),
            authorityCertIssuer: [
              new GeneralName({
                directoryName: AsnConvert.parse(ca.x509.subjectName.toArrayBuffer(), Name),
              }),
            ],
            authorityCertSerialNumber: ca.serial,
          }),
        ),
      ),
    });

    const crlNumber = new Extension({
      critical: false,
      extnID: id_ce_cRLNumber,
      extnValue: new OctetString(AsnConvert.serialize(new CRLNumber(serial))),
    });

    const tbsCertList = new TBSCertList({
      version: Version.v2,
      signature: signatureAlgorithm,
      issuer,
      thisUpdate: new Time(now),
      nextUpdate: new Time(next),
      revokedCertificates,
      crlExtensions: [crlAki, crlNumber],
    });

    const tbs = AsnConvert.serialize(tbsCertList);
    const signature = ecdsaWebSigToBER(
      await crypto.subtle.sign(
        {
          name: 'ECDSA',
          hash: 'SHA-256',
        },
        key,
        tbs,
      ),
    );

    const certList = new CertificateList({
      tbsCertList,
      signatureAlgorithm,
      signature,
    });

    const der = AsnConvert.serialize(certList);
    await fs.writeFile(path, Buffer.from(der));

    return new Crl(path, key);
  }

  private async read(): Promise<TBSCertList> {
    const der = await fs.readFile(this.path);
    const certList = AsnConvert.parse(der, CertificateList);

    console.debug('verify crl signature');
    const tbs = AsnConvert.serialize(certList.tbsCertList);
    const valid = await crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: 'SHA-256',
      },
      this.key,
      ecdsaBERToWebSig(certList.signature),
      tbs,
    );
    if (!valid) throw new Error('CRL signature is invalid');

    return certList.tbsCertList;
  }

  public async check(): Promise<void> {
    await this.read();
  }

  public async date(): Promise<Date> {
    const crl = await this.read();
    return crl.thisUpdate.getTime();
  }

  public async serial(): Promise<Buffer> {
    const crl = await this.read();
    const numext = crl.crlExtensions?.find((ext) => ext.extnID === id_ce_cRLNumber);
    if (!numext) throw new Error('CRL missing CRLNumber extension');
    const num = AsnConvert.parse(numext.extnValue, CRLNumber);
    return numberToBuffer(num.value);
  }

  public async asBuffer(): Promise<Buffer> {
    await this.read(); // verify signature
    return fs.readFile(this.path);
  }
}
