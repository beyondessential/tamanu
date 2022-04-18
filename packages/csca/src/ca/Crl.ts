import { promises as fs } from 'fs';

import {
  CertificateList,
  TBSCertList,
  Version,
  Name,
  Time,
  Extension,
  AuthorityKeyIdentifier,
  id_ce_authorityKeyIdentifier,
  GeneralName,
  CRLNumber,
  id_ce_cRLNumber,
  RevokedCertificate,
} from '@peculiar/asn1-x509';
import {
  AuthorityKeyIdentifierExtension,
  EcAlgorithm,
  Extension as X509Extension,
  HashedAlgorithm,
} from '@peculiar/x509';
import { AsnConvert, OctetString } from '@peculiar/asn1-schema';
import { add } from 'date-fns';

import Certificate from './Certificate';
import State, { readSerial } from './State';
import crypto from '../crypto';

function asAki(ext: X509Extension | undefined): AuthorityKeyIdentifierExtension | undefined {
  if (ext instanceof AuthorityKeyIdentifierExtension) return ext;
}

export default class Crl {
  private path: string;

  constructor(path: string) {
    this.path = path;
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

    const serial = readSerial(await state.nextCrlSerial());

    const revokedCertificates = revokedCerts.length ? revokedCerts.map(cert => new RevokedCertificate({
      revocationDate: new Time(cert.revocationDate!),
      userCertificate: cert.serial,
    })) : undefined;

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
    const tbsCertList = new TBSCertList({
      version: Version.v2,
      signature: signatureAlgorithm,
      issuer,
      thisUpdate: new Time(now),
      nextUpdate: new Time(next),
      revokedCertificates,
      crlExtensions: [
        new Extension({
          critical: false,
          extnID: id_ce_authorityKeyIdentifier,
          extnValue: new OctetString(
            AsnConvert.serialize(
              new AuthorityKeyIdentifier({
                keyIdentifier: new OctetString(
                  Buffer.from(
                    asAki(ca.x509.extensions.find(ext => ext.type === id_ce_authorityKeyIdentifier))
                      ?.keyId!,
                    'hex',
                  ),
                ),
                authorityCertIssuer: [
                  new GeneralName({
                    directoryName: AsnConvert.parse(ca.x509.subjectName.toArrayBuffer(), Name),
                  }),
                ],
                authorityCertSerialNumber: ca.serial,
              }),
            ),
          ),
        }),
        new Extension({
          critical: false,
          extnID: id_ce_cRLNumber,
          extnValue: new OctetString(AsnConvert.serialize(new CRLNumber(serial))),
        }),
      ],
    });

    const signingAlgorithm = key.algorithm as HashedAlgorithm;
    const tbs = AsnConvert.serialize(tbsCertList);
    const signature = await crypto.subtle.sign(signingAlgorithm, key, tbs);

    const certList = new CertificateList({
      tbsCertList,
      signatureAlgorithm,
      signature,
    });

    const der = AsnConvert.serialize(certList);
    await fs.writeFile(path, Buffer.from(der));

    return new Crl(path);
  }
}
