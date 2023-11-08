/* eslint-disable camelcase, @typescript-eslint/camelcase, no-bitwise */

import { AsnConvert } from '@peculiar/asn1-schema';
import {
  AttributeTypeAndValue,
  CRLDistributionPoints,
  DistributionPoint,
  DistributionPointName,
  GeneralName,
  IssueAlternativeName,
  Name,
  PrivateKeyUsagePeriod,
  RelativeDistinguishedName,
  id_ce_cRLDistributionPoints,
  id_ce_issuerAltName,
  id_ce_privateKeyUsagePeriod,
  id_ce_subjectAltName,
} from '@peculiar/asn1-x509';
import {
  AuthorityKeyIdentifierExtension,
  BasicConstraintsExtension,
  ExtendedKeyUsageExtension,
  Extension as X509Extension,
  KeyUsageFlags,
  KeyUsagesExtension,
  SubjectKeyIdentifierExtension,
} from '@peculiar/x509';

import crypto from '../crypto';
import { DocumentTypeList } from '../ext/DocumentType';
import Certificate, { CertificateCreateParams } from './Certificate';
import { id_icao_mrtd_security_extensions_documentTypeList } from './constants';

export interface Extension {
  name: ExtensionName;
  critical: boolean;
  value: 'computed' | (string | object | boolean | number)[];
}

// For extension reference/docs, look at each method below. Referenced documents:
//
// - "Doc 9303-12": ICAO Doc 9303, part 12, eighth edition (2021)
//   https://www.icao.int/publications/Documents/9303_p12_cons_en.pdf
//
// - "VDS-NC": ICAO VDS-NC Technical Report, v1.1 (2021)
//   https://www.icao.int/Security/FAL/TRIP/PublishingImages/Pages/Publications/Visible%20Digital%20Seal%20for%20non-constrained%20environments%20%28VDS-NC%29.pdf
//
// - "2021/1073": EU Directive 2021/1073 (EU Digital Covid Certifications)
//   https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32021D1073&qid=1646601474302&from=EN
//
// - "RFC 5280": IETF RFC 5280, PKIX Certificate and CRL Profile (2008)
//   https://tools.ietf.org/html/rfc5280
//
// Criticality of an extension is a flag for the consumer, which means that the
// extension must be read and processed, and that a critical extension which
// cannot be interpreted is a fatal error. In other words, non-critical
// extensions can be ignored. The criticality of an extension is specified by
// 9303-12, generally in the tables in §7.1.
export enum ExtensionName {
  AuthorityKeyIdentifier = 'AuthorityKeyIdentifier',
  BasicConstraints = 'BasicConstraints',
  CrlDistributionPoints = 'CrlDistributionPoints',
  DocType = 'DocType',
  ExtendedKeyUsage = 'ExtendedKeyUsage',
  IssuerAltName = 'IssuerAltName',
  KeyUsage = 'KeyUsage',
  PrivateKeyUsagePeriod = 'PrivateKeyUsagePeriod',
  SubjectAltName = 'SubjectAltName',
  SubjectKeyIdentifier = 'SubjectKeyIdentifier',
}

export const ComputedExtension = 'computed';

// BasicConstraint (BC): a standard (X.509) extension that indicates whether this
// certificate is that of a CA (i.e. that it is used to issue other certificates)
// and the maximum number of intermediate certificates that may follow it in the
// CA's chain of trust hierarchy ("path length").
//
// Doc 9303-12 §7.1.1 (Table 6) specifies that the CSCA certificate MUST have
// CA:TRUE and pathLenConstraint:0. All other certificates (i.e. those issued)
// MUST NOT have the extension (except for CSCA Links, not handled at this time).
const BC_VALUE_ERROR = 'Invalid BasicConstraint value: expected a boolean and a uint';
function bc({ critical, value }: Extension): X509Extension {
  if (value === ComputedExtension) throw new Error('BasicConstraint connot be computed');
  if (value.length !== 2) throw new Error(BC_VALUE_ERROR);

  const [ca, pathLen] = value;
  if (typeof ca !== 'boolean') throw new Error(BC_VALUE_ERROR);
  if (typeof pathLen !== 'number' || pathLen < 0) throw new Error(BC_VALUE_ERROR);

  return new BasicConstraintsExtension(ca, pathLen, critical);
}

// AuthorityKeyIdentifier (AKI): a standard (X.509) extension that contains the
// identifier of the public key used to issue this certificate, and possibly
// other details such as the distinguished name ("subject") and serial of the
// issuer certificate.
//
// Doc 9303-12 §7.1.1 (Table 6) specifies that the CSCA certificate MAY have
// this extension, but that all issued certificates MUST have it. Within the
// extension, the issuer's key identifier is required, and the issuer's subject
// or serial number are optional.
//
// VDS-NC specifies that its barcode signers must comply with the barcode signer
// profile defined in Doc 9303-12 §7.1.3, which specifies that the AKI MUST be
// present.
//
// 2021/1073 specifies that the AKI MUST be present, and match the CSCA's SKI.
async function aki(
  { critical, value }: Extension,
  publicKey: CryptoKey,
  issuer?: Certificate,
): Promise<X509Extension> {
  if (value !== ComputedExtension) {
    throw new Error('AuthorityKeyIdentifier must be computed');
  }

  if (issuer instanceof Certificate) {
    return AuthorityKeyIdentifierExtension.create(issuer.x509, critical, crypto as Crypto);
  }

  return AuthorityKeyIdentifierExtension.create(publicKey, critical, crypto as Crypto);
}

// SubjectKeyIdentifier (SKI): a standard (X.509) extension that contains the
// identifier of the public key used to generate this certificate. This public
// key is part of the key pair that the certificate represents. The SKI can be
// used to identify this certificate in other contexts, such as for AKIs.
// Generally, the identifier is the SHA-1 hash of the public key.
//
// Doc 9303-12 §7.1.1 (Table 6) specifies that the CSCA certificate MUST have
// this extension, and that all other certificates MAY have it. In practice it
// is strongly recommended that it be present, unless explicitly prohibited.
//
// VDS-NC specifies that its barcode signers must comply with the barcode signer
// profile defined in Doc 9303-12 §7.1.3, which specifies that the SKI extension
// MUST NOT be present.
//
// 2021/1073 however specifies that the SKI extension SHOULD be present.
async function ski({ critical, value }: Extension, publicKey: CryptoKey): Promise<X509Extension> {
  if (value !== ComputedExtension) {
    throw new Error('SubjectKeyIdentifier must be computed');
  }

  return SubjectKeyIdentifierExtension.create(publicKey, critical, crypto as Crypto);
}

// OIDs (Object Identifiers) are used to identify almost every named item in an
// X.509 certificate. The OID is a string of numbers separated by periods, in a
// hierarchical manner. For "standard" or "well-known" OIDs, there are public
// reference sites that provide a directory of OIDs. For example, for CN:
// https://oidref.com/2.5.4.3
//
// OIDs for proprietary and custom extensions or objects are specified by the
// providing specification.
//
// These particular OIDs are those used in Distinguished Names (DN), or Subjects.
// They are used to identify the entity that a certificate is for, or (in the
// case of AKI or IAN), the entity which issued the certificate.
//
// DN OIDs also have short names, such as "CN" for Common Name, etc. These are
// often seen in the OpenSSL diagnostic output for certificates.
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

enum AltVariant {
  Subject = 0,
  Issuer = 1,
}

// SubjectAltName (SAN) and IssuerAltName (IAN): two standard (X.509) extensions
// that contain a list of alternative names for the subject or issuer of a
// certificate. These are often used as supplemental information to the DN.
//
// Doc 9303-12 §7.1.1 (Table 6) specifies that ALL certificates MUST have both
// of these extensions, but certain profiles override this and prohibit them.
//
// When present, the extensions follow §7.1.1.2, which specifies that they
// SHOULD contain at least one of an email, URI, or DNS name as contact
// information, and that they MUST contain the ISO 3166 alpha-3 country code of
// the issuer or subject (as appropriate) as the localityName (L) field.
//
// VDS-NC specifies that its barcode signers must comply with the barcode signer
// profile defined in Doc 9303-12 §7.1.3, which prohibits both of these.
//
// Under 2021/1073, the signers are Document Signers, as described in Table 6,
// thus both these extensions are required.
function altName({ critical, value }: Extension, alt: AltVariant): X509Extension {
  if (value === ComputedExtension) throw new Error('SubjectKeyIdentifier cannot be computed');
  if (value.length !== 1 && typeof value[0] !== 'object')
    throw new Error('Invalid altName value: expected an array of a single object');

  const values: object = value[0] as object;

  const rdn = new RelativeDistinguishedName();
  for (const [type, value] of Object.entries(values)) {
    const attr = new AttributeTypeAndValue({
      type: NAME_OIDS.get(type) ?? type,
    });

    if (value[0] === '#') {
      attr.value.anyValue = Buffer.from(value.slice(1), 'hex');
    } else if (type === 'E' || type === 'DC') {
      attr.value.ia5String = value;
    } else {
      attr.value.printableString = value;
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

    default:
      throw new Error('Invalid altName variant');
  }
}

// PrivateKeyUsagePeriod (PKUP): a standard (X.509) but less well-known extension
// that describes the period of time in which the private key the certificate
// represents will be "in use" for. "In use" refers to issuing certificates or
// signing documents (or other such activities).
//
// Doc 9303-12 §7.1.1 (Table 6) specifies that the CSCA certificate and the
// Document Signer MUST have this extension, and that other certificates MAY
// have it. However, certain profiles override this and prohibit it.
//
// When present, the extension MUST have at least one of the notBefore or
// notAfter fields, and they must be encoded as GeneralizedTime values.
//
// VDS-NC specifies that its barcode signers must comply with the barcode signer
// profile defined in Doc 9303-12 §7.1.3, which prohibits this extension.
//
// Under 2021/1073, the signers are Document Signers, as described in Table 6,
// thus this extension is required.
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

    const notBefore = new Date(notBeforeStr as string);
    if (notBefore.getTime() === 0) throw new Error('Invalid pkup value: notBefore: not a date');

    const notAfter = new Date(notAfterStr as string);
    if (notAfter.getTime() === 0) throw new Error('Invalid pkup value: notAfter: not a date');

    out = new PrivateKeyUsagePeriod({
      notBefore,
      notAfter,
    });
  }

  return new X509Extension(id_ce_privateKeyUsagePeriod, critical, AsnConvert.serialize(out));
}

// KeyUsage (KU): a standard (X.509) extension that describes the purpose of the
// private key the certificate represents. It is used to indicate what kind of
// cryptographic operations the private key is to be used for.
//
// Doc 9303-12 §7.1.1 (Table 6) specifies that ALL certificates MUST have this
// extension. However, certain profiles override this and prohibit it.
//
// When present on a CSCA certificate, the extension MUST have only the
// keyCertSign (certificate issuance) and cRLSign (certificate revocation) bits
// set.
//
// When present on a Document Signer certificate, the extension MUST have only
// the digitalSignature (document signing) bit set.
//
// For other certificate profiles, refer to Doc 9303-12.
//
// VDS-NC specifies that its barcode signers must comply with the barcode signer
// profile defined in Doc 9303-12 §7.1.3, which prohibits this extension.
//
// Under 2021/1073, the signers are Document Signers, as described in Table 6,
// thus this extension is required.
function ku({ critical, value }: Extension): X509Extension {
  if (value === ComputedExtension) throw new Error('KeyUsage cannot be computed');
  if (value.some((s) => typeof s !== 'string'))
    throw new Error('Invalid keyUsage value: expected an array of strings');

  let keyUsage = 0;
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

// ExtendedKeyUsage (EKU): a standard (X.509) extension that describes more uses
// and purposes of the private key the certificate represents. It is used to
// indicate what kind of documents and certificates the certificate will sign,
// or what application it will be used for.
//
// Doc 9303-12 §7.1.1 (Table 6) specifies that CSCA certificates MUST NOT have
// this extension, and that some other certificates MUST have it, in accordance
// with §7.1.1.3.
//
// However, VDS-NC specifies that the CSCA certificate MAY opt in to restrict
// itself to be used only for Health purposes (as opposed to Passport/Travel),
// and this it must do so by adding a EKU with the OID 2.23.136.1.1.14.1 to the
// Health CSCA, and omit it from the Passport/Travel CSCA.
//
// For Barcode Signers, VDS-NC specifies that the EKU must contain the OID
// 2.23.136.1.1.14.2.
//
// For EU DCC Document Signers, 2021/1073 specifies that the EKU SHOULD contain
// zero or more of the following OIDs:
//
// - 1.3.6.1.4.1.1847.2021.1.1 for Test Issuers
// - 1.3.6.1.4.1.1847.2021.1.2 for Vaccination Issuers
// - 1.3.6.1.4.1.1847.2021.1.3 for Recovery Issuers
//
// An EU DCC Document Signer with no EKU or an empty EKU, the signer is assumed
// to be able to issue ANY kind of document.
function eku({ critical, value }: Extension): X509Extension {
  if (value === ComputedExtension) throw new Error('ExtendedKeyUsage cannot be computed');
  if (value.some((s) => typeof s !== 'string'))
    throw new Error('Invalid eku value: expected an array of strings');

  return new ExtendedKeyUsageExtension(value as string[], critical);
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

// CRLDistributionPoints (CRL/CDP): a standard (X.509) extension that describes
// where the CRL for the certificate or CA is located. It is an important part
// of certificate trust: the CRL must be consulted before a certificate is to be
// trusted.
//
// Doc 9303-12 §7.1.1 (Table 6) specifies that almost ALL certificates MUST have
// the extension. However, certain profiles override this and prohibit it.
//
// When present, the extension MUST contain at least one DistributionPoint (DP),
// and MUST NOT use the `reasons` or `crlIssuer` fields. DPs MUST use the scheme
// `http`, `https`, or `ldap`, although `https` is NOT recommended by RFC 5280.
// Further requirements and guidelines are specifed in §7.1.1.4.
//
// VDS-NC specifies that its barcode signers must comply with the barcode signer
// profile defined in Doc 9303-12 §7.1.3, which prohibits this extension.
//
// Under 2021/1073, the signers are Document Signers, as described in Table 6,
// thus this extension is required.
function crl({ critical, value }: Extension, issuer?: Certificate): X509Extension | undefined {
  if (value === ComputedExtension) {
    const icdp = issuer?.x509.extensions.find((e) => e.type === id_ce_cRLDistributionPoints);
    if (!icdp) return undefined;

    return new X509Extension(id_ce_cRLDistributionPoints, critical, icdp.value);
  }

  if (value.some((s) => typeof s !== 'string')) {
    throw new Error('Invalid crl value: expected an array of strings');
  }

  return new X509Extension(
    id_ce_cRLDistributionPoints,
    critical,
    AsnConvert.serialize(new CRLDistributionPoints(value.map(urlToDispPoint))),
  );
}

// DocumentTypeList (DT): a proprietary ICAO extension that describes the kinds
// of documents a Document Signer may issue.
//
// Doc 9303-12 §7.1.1 (Table 6) specifies that ONLY Document Signers (and their
// descendant profiles) MUST have this extension. The structure of the extension
// is described in detail (ASN.1) in §7.1.1.6.
//
// VDS-NC specifies that its barcode signers must comply with the barcode signer
// profile defined in Doc 9303-12 §7.1.3, which is a descendant of Document
// Signers, and thus this extension is required.
//
// Further, VDS-NC specifies the Document Type values to be used:
//
// - "NT" for Proof of Test
// - "NV" for Proof of Vaccination
//
// It also reserves the "N" and "U" prefixes for ICAO use, and specifies that
// nations may make use of other Document Types as long as they do not conflict.
//
// Under 2021/1073, the signers are Document Signers, but the Document Type List
// is not used.
function docType({ critical, value }: Extension): X509Extension {
  if (value === ComputedExtension) throw new Error('ExtendedKeyUsage cannot be computed');
  if (value.some((s) => typeof s !== 'string'))
    throw new Error('Invalid eku value: expected an array of strings');

  const dtv = new DocumentTypeList();
  for (const val of value) {
    // rome-ignore lint/suspicious/noExplicitAny: the typings for asn1-x509 are incomplete
    dtv.docTypeList.push(val as any);
  }

  return new X509Extension(
    id_icao_mrtd_security_extensions_documentTypeList,
    critical,
    AsnConvert.serialize(dtv),
  );
}

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
      case ExtensionName.CrlDistributionPoints: {
        const crldp = crl(ext, issuer);
        if (crldp) exts.push(crldp);
        break;
      }
      case ExtensionName.DocType:
        exts.push(docType(ext));
        break;
      default:
        throw new Error(`Unknown extension: ${ext.name}`);
    }
  }

  return exts;
}
