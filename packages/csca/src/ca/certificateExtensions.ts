import {
  AsnConvert,
  AsnType,
  AsnTypeTypes,
  AsnArray,
  AsnProp,
  AsnPropTypes,
} from '@peculiar/asn1-schema';
import {
  id_ce_privateKeyUsagePeriod,
  id_ce_issuerAltName,
  id_ce_cRLDistributionPoints,
  id_ce_subjectAltName,
  PrivateKeyUsagePeriod,
  GeneralName,
  IssueAlternativeName,
  Name,
  RelativeDistinguishedName,
  AttributeTypeAndValue,
  CRLDistributionPoints,
  DistributionPoint,
  DistributionPointName,
} from '@peculiar/asn1-x509';
import {
  Extension as X509Extension,
  BasicConstraintsExtension,
  AuthorityKeyIdentifierExtension,
  SubjectKeyIdentifierExtension,
  KeyUsageFlags,
  KeyUsagesExtension,
  ExtendedKeyUsageExtension,
} from '@peculiar/x509';

import Certificate, { CertificateCreateParams } from './Certificate';
import { id_ce_docType } from './constants';
import crypto from '../crypto';

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

export async function forgeExtensions(
  params: CertificateCreateParams,
  subjectPublicKey: CryptoKey,
  issuer?: Certificate,
): Promise<X509Extension[]> {
  const exts: X509Extension[] = [];

  for (const ext of params.extensions) {
    switch (ext.name) {
      case ExtensionName.BasicConstraints:
        exts.push(bc(ext));
        break;
      case ExtensionName.AuthorityKeyIdentifier:
        exts.push(await aki(ext, subjectPublicKey, issuer));
        break;
      case ExtensionName.SubjectKeyIdentifier:
        exts.push(await ski(ext, subjectPublicKey));
        break;
      case ExtensionName.SubjectAltName:
        exts.push(altName(ext, AltVariant.Subject));
        break;
      case ExtensionName.IssuerAltName:
        exts.push(altName(ext, AltVariant.Issuer));
        break;
      case ExtensionName.PrivateKeyUsagePeriod:
        exts.push(pkup(ext, params));
        break;
      case ExtensionName.KeyUsage:
        exts.push(ku(ext));
        break;
      case ExtensionName.ExtendedKeyUsage:
        exts.push(eku(ext));
        break;
      case ExtensionName.CrlDistributionPoints:
        const crldp = crl(ext, issuer);
        if (crldp) exts.push(crldp);
        break;
      case ExtensionName.DocType:
        exts.push(docType(ext));
        break;
    }
  }

  return exts;
}

enum AltVariant {
  Subject,
  Issuer,
}

const BC_VALUE_ERROR = 'Invalid BasicConstraint value: expected a boolean and a uint';
function bc({ critical, value }: Extension): X509Extension {
  if (value === ComputedExtension) throw new Error('BasicConstraint connot be computed');
  if (value.length !== 2) throw new Error(BC_VALUE_ERROR);

  const [ca, pathLen] = value;
  if (typeof ca !== 'boolean') throw new Error(BC_VALUE_ERROR);
  if (typeof pathLen !== 'number' || pathLen < 0) throw new Error(BC_VALUE_ERROR);

  return new BasicConstraintsExtension(ca, pathLen, critical);
}

async function aki(
  { critical, value }: Extension,
  publicKey: CryptoKey,
  issuer?: Certificate,
): Promise<X509Extension> {
  if (value !== ComputedExtension) {
    throw new Error('AuthorityKeyIdentifier must be computed');
  }

  if (issuer instanceof Certificate) {
    return AuthorityKeyIdentifierExtension.create(issuer.x509, critical, crypto);
  } else {
    return AuthorityKeyIdentifierExtension.create(publicKey, critical, crypto);
  }
}

async function ski({ critical, value }: Extension, publicKey: CryptoKey): Promise<X509Extension> {
  if (value !== ComputedExtension) {
    throw new Error('SubjectKeyIdentifier must be computed');
  }

  return SubjectKeyIdentifierExtension.create(publicKey, critical, crypto);
}

const NAME_OIDS = new Map(
  Object.entries({
    CN: '2.5.4.3',
    L: '2.5.4.7',
    ST: '2.5.4.8',
    O: '2.5.4.10',
    OU: '2.5.4.11',
    C: '2.5.4.6',
    DC: '0.9.2342.19200300.100.1.25',
    E: '1.2.840.113549.1.9.1',
    G: '2.5.4.42',
    I: '2.5.4.43',
    SN: '2.5.4.4',
    T: '2.5.4.12',
  }),
);

function altName({ critical, value }: Extension, alt: AltVariant): X509Extension {
  if (value === ComputedExtension) throw new Error('SubjectKeyIdentifier cannot be computed');
  if (value.length !== 1 && typeof value[0] !== 'object')
    throw new Error('Invalid altName value: expected an array of a single object');

  const values: object = value[0];

  const rdn = new RelativeDistinguishedName();
  for (const [type, value] of Object.entries(values)) {
    const attr = new AttributeTypeAndValue({
      type: NAME_OIDS.get(type) ?? type,
    });

    if (value[0] === '#') {
      attr.value.anyValue = Buffer.from(value.slice(1), 'hex');
    } else {
      if (type === 'E' || type === 'DC') {
        attr.value.ia5String = value;
      } else {
        attr.value.printableString = value;
      }
    }

    rdn.push(attr);
  }

  const name = new IssueAlternativeName([
    new GeneralName({
      directoryName: new Name([rdn]),
    }),
  ]);

  switch (alt) {
    case AltVariant.Subject:
      return new X509Extension(id_ce_subjectAltName, critical, AsnConvert.serialize(name));

    case AltVariant.Issuer:
      return new X509Extension(id_ce_issuerAltName, critical, AsnConvert.serialize(name));
  }
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

  return new X509Extension(id_ce_privateKeyUsagePeriod, critical, AsnConvert.serialize(out));
}

function ku({ critical, value }: Extension): X509Extension {
  if (value === ComputedExtension) throw new Error('KeyUsage cannot be computed');
  if (value.some(s => typeof s !== 'string'))
    throw new Error('Invalid keyUsage value: expected an array of strings');

  let keyUsage: KeyUsageFlags = 0;
  for (const usage of value) {
    switch (usage) {
      case 'cRLSign':
        keyUsage |= KeyUsageFlags.cRLSign;
        break;
      case 'dataEncipherment':
        keyUsage |= KeyUsageFlags.dataEncipherment;
        break;
      case 'decipherOnly':
        keyUsage |= KeyUsageFlags.decipherOnly;
        break;
      case 'digitalSignature':
        keyUsage |= KeyUsageFlags.digitalSignature;
        break;
      case 'encipherOnly':
        keyUsage |= KeyUsageFlags.encipherOnly;
        break;
      case 'keyAgreement':
        keyUsage |= KeyUsageFlags.keyAgreement;
        break;
      case 'keyCertSign':
        keyUsage |= KeyUsageFlags.keyCertSign;
        break;
      case 'keyEncipherment':
        keyUsage |= KeyUsageFlags.keyEncipherment;
        break;
      case 'nonRepudiation':
        keyUsage |= KeyUsageFlags.nonRepudiation;
        break;
      default:
        throw new Error(`Unknown keyUsage value: ${usage}`);
    }
  }

  return new KeyUsagesExtension(keyUsage, critical);
}

function eku({ critical, value }: Extension): X509Extension {
  if (value === ComputedExtension) throw new Error('ExtendedKeyUsage cannot be computed');
  if (value.some(s => typeof s !== 'string'))
    throw new Error('Invalid eku value: expected an array of strings');

  return new ExtendedKeyUsageExtension(value, critical);
}

function crl({ critical, value }: Extension, issuer?: Certificate): X509Extension | undefined {
  if (value === ComputedExtension) {
    const icdp = issuer?.x509.extensions.find(e => e.type === id_ce_cRLDistributionPoints);
    if (icdp) return new X509Extension(id_ce_cRLDistributionPoints, critical, icdp.value);
  } else {
    if (value.some(s => typeof s !== 'string')) {
      throw new Error('Invalid crl value: expected an array of strings');
    }

    function urlToDispPoint(url: string): DistributionPoint {
      return new DistributionPoint({
        distributionPoint: new DistributionPointName({
          fullName: [
            new GeneralName({
              dNSName: url,
            }),
          ],
        }),
      });
    }

    return new X509Extension(
      id_ce_cRLDistributionPoints,
      critical,
      AsnConvert.serialize(new CRLDistributionPoints(value.map(urlToDispPoint))),
    );
  }
}

function docType({ critical, value }: Extension): X509Extension {
  if (value === ComputedExtension) throw new Error('ExtendedKeyUsage cannot be computed');
  if (value.some(s => typeof s !== 'string'))
    throw new Error('Invalid eku value: expected an array of strings');

  const dtv = new DocTypeValue();
  dtv.docTypes = new DocTypeSet();
  for (const val of value) {
    dtv.docTypes.push(val);
  }

  return new X509Extension(id_ce_docType, critical, AsnConvert.serialize(dtv));
}

@AsnType({ type: AsnTypeTypes.Set, itemType: AsnPropTypes.PrintableString })
class DocTypeSet extends AsnArray<string> {
  constructor() {
    super([]);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, DocTypeValue.prototype);
  }
}

@AsnType({ type: AsnTypeTypes.Sequence })
class DocTypeValue {
  @AsnProp({ type: AsnPropTypes.Integer, defaultValue: 0 })
  public version = 0;

  @AsnProp({ type: DocTypeSet })
  public docTypes: DocTypeSet = [];
}
