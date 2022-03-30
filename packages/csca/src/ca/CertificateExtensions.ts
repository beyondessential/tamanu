import { AsnConvert } from '@peculiar/asn1-schema';
import { id_ce_privateKeyUsagePeriod, PrivateKeyUsagePeriod } from '@peculiar/asn1-x509';
import { Extension as X509Extension } from '@peculiar/x509';
import { CertificateCreateParams } from './Certificate';

export function forgeExtensions(params: CertificateCreateParams): X509Extension[] {
  const exts: X509Extension[] = [];

  for (const ext of params.extensions) {
    switch (ext.name) {
      // TODO: the rest
      case ExtensionName.PrivateKeyUsagePeriod:
        exts.push(pkup(ext, params));
        break;
    }
  }

  return exts;
}

function pkup({ critical, value }: Extension, params: CertificateCreateParams): X509Extension {
  let out: PrivateKeyUsagePeriod;
  if (value === ComputedExtension && params.workingPeriod) {
    out = new PrivateKeyUsagePeriod({
      notBefore: params.workingPeriod.start,
      notAfter: params.workingPeriod.end,
    });
  } else {
    if (value.length !== 2) throw new Error('Invalid pkup value: expected two dates');
    const [notBeforeStr, notAfterStr] = value;

    const notBefore = new Date(notBeforeStr);
    if (notBefore.getTime() === 0) throw new Error('Invalid pkup value: notBefore: not a date');

    const notAfter = new Date(notAfterStr);
    if (notAfter.getTime() === 0) throw new Error('Invalid pkup value: notAfter: not a date');

    out = new PrivateKeyUsagePeriod({
      notBefore,
      notAfter,
    });
  }

  return new X509Extension(id_ce_privateKeyUsagePeriod, critical, AsnConvert.serialize(value));
}

export interface Extension {
  name: ExtensionName;
  critical: boolean;
  value: 'computed' | any[];
}

export enum ExtensionName {
  BasicConstraints = 'BasicConstraints',
  AuthorityKeyIdentifier = 'AuthorityKeyIdentifier',
  SubjectKeyIdentifier = 'SubjectKeyIdentifier',
  SubjectAltName = 'SubjectAltName',
  IssuerAltName = 'IssuerAltName',
  PrivateKeyUsagePeriod = 'PrivateKeyUsagePeriod',
  KeyUsage = 'KeyUsage',
  ExtendedKeyUsage = 'ExtendedKeyUsage',
  CrlDistributionPoints = 'CrlDistributionPoints',
  DocType = 'DocType',
}

export const ComputedExtension = 'computed';
