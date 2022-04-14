import { promises as fs } from 'fs';

import { CertificateList, TBSCertList, Version, Name, Time } from '@peculiar/asn1-x509';
import { add } from 'date-fns';

import Certificate from './Certificate';
import State from './State';
import { EcAlgorithm } from '@peculiar/x509';
import { AsnConvert } from '@peculiar/asn1-schema';

export default class Crl {
  private path: string;

  constructor(path: string) {
    this.path = path;
  }

  /** @internal public only for CA use, do not use directly */
  public static async fromState(path: string, key: CryptoKey, ca: Certificate, state: State): Promise<Crl> {
    const revokedCerts = await state.revokedCertificates();

    const signatureAlgorithm = new EcAlgorithm().toAsnAlgorithm(ca.x509.signatureAlgorithm);
    if (!signatureAlgorithm) throw new Error('Unsupported signature algorithm');

    // annoyingly this is the only way to get back the original from the x509 lib
    const issuer = AsnConvert.parse(ca.x509.subjectName.toArrayBuffer(), Name);

    const now = new Date();
    const next = add(now, { days: 90 });

    // Doc 9303-12 defines the CRL profile in §7.1.4:
    // - Version 2
    // - Signature algo on the tbsCertList and outer CertList must match
    // - revoked cert list cannot be empty — if there's no certs, don't include the field
    //   - revoked cert entries must not themselves have any extensions
    //     (e.g. reasonCode, holdInstructionCode, etc)
    // - issuer must at least have the country name, and optionally the serial
    // - extensions must be present and have:
    //   - AuthorityKeyIdentifier, non-critical, same as the CSCA's SKI (required)
    //   - AuthorityCertSerialNumber, non-critical, same as the CSCA's serial (optional)
    //   - IssuerAltName, non-critical, only in the case of CSCA name change
    //   - CRLNumber, non-critical, in minimal padding format (required)
    //   - no other extensions
    const tbsCertList = new TBSCertList({
      version: Version.v2,
      signature: signatureAlgorithm,
      issuer,
      thisUpdate: new Time(now),
      nextUpdate: new Time(next),
      crlExtensions: [
        //
      ],
    });

    const signature = undefined; // TODO
    // await key.sign(tbsCertList.toSchema().toBER(false), 'SHA-256');

    const certList = new CertificateList({
      tbsCertList,
      signatureAlgorithm,
      signature,
    });

    return new Crl(path);
  }
}
