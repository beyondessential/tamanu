import config from 'config';
import nodeCrypto from 'crypto';
import { add } from 'date-fns';
import { Crypto } from '@peculiar/webcrypto';
import {
  fromBER,
  Integer,
  PrintableString,
  Utf8String,
  BitString,
  OctetString,
  Sequence,
  Set as Asn1Set,
} from 'asn1js';
import {
  Time,
  setEngine,
  CryptoEngine,
  Certificate,
  CertificationRequest,
  AttributeTypeAndValue,
  BasicConstraints,
  Extension,
  Extensions,
  ExtKeyUsage,
  AuthorityKeyIdentifier,
} from 'pkijs';
import { ICAO_DOCUMENT_TYPES, X502_OIDS } from '@tamanu/constants';
import { depem, pem } from 'shared/utils';
import { getLocalisation } from '../../localisation';

const webcrypto = new Crypto();
setEngine(
  'webcrypto',
  webcrypto,
  new CryptoEngine({ name: 'webcrypto', crypto: webcrypto, subtle: webcrypto.subtle }),
);

/**
 * Generate a Document/Barcode Signer compliant keypair and CSR.
 *
 * @returns The fields to use to create the Signer model.
 */
export async function newKeypairAndCsr() {
  const { publicKey, privateKey } = await webcrypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['sign', 'verify'],
  );

  const { keySecret, commonName, provider } = config.integrations.signer;

  const countryCode = (await getLocalisation()).country['alpha-2'];

  const csr = new CertificationRequest();
  csr.version = 0;
  csr.attributes = [];
  csr.subject.typesAndValues.push(
    new AttributeTypeAndValue({
      type: X502_OIDS.COUNTRY_NAME,
      value: new PrintableString({ value: countryCode }),
    }),
  );
  csr.subject.typesAndValues.push(
    new AttributeTypeAndValue({
      type: X502_OIDS.COMMON_NAME,
      value: new PrintableString({ value: commonName }),
    }),
  );
  if (provider) {
    csr.subject.typesAndValues.push(
      new AttributeTypeAndValue({
        type: X502_OIDS.ORGANISATION_NAME,
        value: new PrintableString({ value: provider }),
      }),
    );
  }

  // 9303-12 §7.1.3 specifies that the Signer certificate must have certain
  // extensions. However, while CSRs may have extensions, these are NOT
  // transferred to the certificate upon signing. Instead, the intent is that
  // extensions are set by the issuer (the CSCA). Thus, we don't need to add
  // them here.

  await csr.subjectPublicKeyInfo.importKey(publicKey);
  await csr.sign(privateKey, 'SHA-256');
  const packedCsr = Buffer.from(await csr.toSchema().toBER(false));

  const passphrase = Buffer.from(keySecret, 'base64');
  const privateNodeKey = nodeCrypto.createPrivateKey({
    key: new Uint8Array(await webcrypto.subtle.exportKey('pkcs8', privateKey)),
    format: 'der',
    type: 'pkcs8',
  });

  return {
    publicKey: fakeABtoRealAB(await webcrypto.subtle.exportKey('spki', publicKey)),
    privateKey: fakeABtoRealAB(
      privateNodeKey.export({
        type: 'pkcs8',
        format: 'der',
        cipher: 'aes-256-cbc',
        passphrase,
      }).buffer,
    ),
    request: pem(packedCsr, 'CERTIFICATE REQUEST'),
  };
}

/**
 * Load the signed certificate from the CSCA.
 *
 * @param {string} certificate The signed certificate from the CSCA.
 * @returns {object} The fields to load into the relevant Signer.
 */
export function loadCertificateIntoSigner(certificate, workingPeriod = {}) {
  let binCert;
  let txtCert;
  if (typeof certificate === 'string') {
    binCert = depem(certificate, 'CERTIFICATE');
    txtCert = certificate;
  } else if (Buffer.isBuffer(certificate)) {
    binCert = certificate;
    txtCert = pem(certificate, 'CERTIFICATE');
  } else {
    throw new Error('Certificate must be a string (PEM) or Buffer (DER).');
  }

  const asn = fromBER(fakeABtoRealAB(binCert));
  if (asn.result.error !== '') throw new Error(asn.result.error);
  const cert = new Certificate({ schema: asn.result });

  const validityPeriodStart = cert.notBefore.value;
  const validityPeriodEnd = cert.notAfter.value;

  // The certificate doesn't include the PKUP, so we assume it from which
  // integration is enabled. In future it would be good to get this directly
  // from issuance API or some other way.
  const workingPeriodStart = workingPeriod.start ?? validityPeriodStart;
  let workingPeriodEnd = workingPeriod.end ?? validityPeriodEnd;
  if (!workingPeriod.end) {
    if (config.integrations.vdsNc?.enabled) {
      workingPeriodEnd = add(workingPeriodStart, { days: 96 });
    }
    if (config.integrations.euDcc?.enabled) {
      workingPeriodEnd = add(workingPeriodStart, { days: 365 });
    }
  }

  return {
    workingPeriodStart,
    workingPeriodEnd,
    validityPeriodStart,
    validityPeriodEnd,
    certificate: txtCert,
  };
}

/**
 * Convert a fake ArrayBuffer to a real ArrayBuffer.
 *
 * Somehow various APIs return a fake ArrayBuffer, which doesn't instanceof as
 * an ArrayBuffer, and the PKI.js/ASN1.js parsers cannot deal. This function
 * converts the input to a real ArrayBuffer, by copying the bytes.
 *
 * @param {ArrayBuffer|Buffer} fake The fake ArrayBuffer.
 * @returns {ArrayBuffer} The real ArrayBuffer.
 */
export function fakeABtoRealAB(fake) {
  return Uint8Array.from(new Uint8Array(fake).values()).buffer;
}

export class TestCSCA {
  constructor(privateKey, publicKey, certificate) {
    this.privateKey = privateKey;
    this.publicKey = publicKey;
    this.certificate = certificate;
    this.serial = 1000;
  }

  static async generate() {
    const { publicKey, privateKey } = await webcrypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true,
      ['sign', 'verify'],
    );

    const workingPeriodStart = new Date();
    const workingPeriodEnd = add(workingPeriodStart, { days: 365 * 4 + 1 });

    const validityPeriodStart = workingPeriodStart;
    const validityPeriodEnd = add(workingPeriodEnd, { days: 365 * 11 + 3 });

    const cert = new Certificate();
    cert.version = 2;
    cert.issuer.typesAndValues.push(
      new AttributeTypeAndValue({
        type: X502_OIDS.COUNTRY_NAME,
        value: new PrintableString({ value: 'UT' }),
      }),
    );
    cert.issuer.typesAndValues.push(
      new AttributeTypeAndValue({
        type: X502_OIDS.COMMON_NAME,
        value: new Utf8String({ value: 'UT CA' }),
      }),
    );
    cert.subject.typesAndValues.push(
      new AttributeTypeAndValue({
        type: X502_OIDS.COUNTRY_NAME,
        value: new PrintableString({ value: 'UT' }),
      }),
    );
    cert.subject.typesAndValues.push(
      new AttributeTypeAndValue({
        type: X502_OIDS.COMMON_NAME,
        value: new Utf8String({ value: 'UT CA' }),
      }),
    );
    cert.notBefore = new Time({
      value: validityPeriodStart,
    });
    cert.notAfter = new Time({
      value: validityPeriodEnd,
    });
    cert.serialNumber = new Integer({ value: 1 });

    await cert.subjectPublicKeyInfo.importKey(publicKey);
    const fingerprint = await webcrypto.subtle.digest(
      { name: 'SHA-1' },
      cert.subjectPublicKeyInfo.subjectPublicKey.valueBlock.valueHex,
    );

    const keyID = new OctetString({ valueHex: fingerprint });
    const authKeyID = new AuthorityKeyIdentifier({
      authorityCertIssuer: cert.issuer,
      authorityCertSerialNumber: cert.serialNumber,
      keyIdentifier: new OctetString({
        valueHex: fingerprint,
      }),
    });

    const basicConstraints = new BasicConstraints({
      cA: true,
      pathLenConstraint: 2,
    });

    /* eslint-disable no-bitwise */
    const bitArray = new ArrayBuffer(1);
    const bitView = new Uint8Array(bitArray);
    bitView[0] |= 0x02; // Key usage "cRLSign" flag
    bitView[0] |= 0x04; // Key usage "keyCertSign" flag
    /* eslint-enable no-bitwise */

    const keyUsage = new BitString({ valueHex: bitArray });

    cert.extensions = new Extensions({
      extensions: [
        new Extension({
          extnID: X502_OIDS.BASIC_CONSTRAINTS,
          critical: true,
          extnValue: basicConstraints.toSchema().toBER(false),
          parsedValue: basicConstraints,
        }),
        new Extension({
          extnID: X502_OIDS.KEY_IDENTIFIER,
          critical: true,
          extnValue: keyID.toBER(false),
          parsedValue: keyID,
        }),
        new Extension({
          extnID: X502_OIDS.AUTHORITY_KEY_IDENTIFIER,
          critical: true,
          extnValue: authKeyID.toSchema().toBER(false),
          parsedValue: authKeyID,
        }),
        new Extension({
          extnID: X502_OIDS.KEY_USAGE,
          critical: false,
          extnValue: keyUsage.toBER(false),
          parsedValue: keyUsage,
        }),
      ],
    });

    await cert.sign(privateKey, 'SHA-256');

    return new TestCSCA(privateKey, publicKey, cert);
  }

  async signCSR(request) {
    const asn = fromBER(fakeABtoRealAB(depem(request, 'CERTIFICATE REQUEST')));
    if (asn.result.error !== '') throw new Error(asn.result.error);
    const csr = new CertificationRequest({ schema: asn.result });

    const workingPeriodStart = new Date();
    const workingPeriodEnd = add(workingPeriodStart, { days: 96 });

    const validityPeriodStart = workingPeriodStart;
    const validityPeriodEnd = add(workingPeriodEnd, {
      days: 365 * 10 + 2,
    });

    const cert = new Certificate();
    cert.version = 2;
    cert.issuer = this.certificate.issuer;
    cert.subject = csr.subject;
    cert.notBefore = new Time({
      value: validityPeriodStart,
    });
    cert.notAfter = new Time({
      value: validityPeriodEnd,
    });
    cert.serialNumber = new Integer({ value: (this.serial += 1) });

    const fingerprint = await webcrypto.subtle.digest(
      { name: 'SHA-1' },
      this.certificate.subjectPublicKeyInfo.subjectPublicKey.valueBlock.valueHex,
    );

    const authKey = new AuthorityKeyIdentifier({
      authorityCertIssuer: this.certificate.issuer,
      authorityCertSerialNumber: this.certificate.serialNumber,
      keyIdentifier: new OctetString({
        valueHex: fingerprint,
      }),
    });

    const docType = new Sequence({
      value: [
        new Integer({ value: 0 }),
        new Asn1Set({
          value: [
            new PrintableString({ value: ICAO_DOCUMENT_TYPES.PROOF_OF_TESTING.DOCTYPE }),
            new PrintableString({ value: ICAO_DOCUMENT_TYPES.PROOF_OF_VACCINATION.DOCTYPE }),
          ],
        }),
      ],
    });

    const extKeyUsage = new ExtKeyUsage({
      keyPurposes: [X502_OIDS.EKU_VDS_NC],
    });

    cert.extensions = [
      new Extension({
        extnID: X502_OIDS.AUTHORITY_KEY_IDENTIFIER,
        critical: true,
        extnValue: authKey.toSchema().toBER(false),
        parsedValue: authKey,
      }),
      new Extension({
        extnID: X502_OIDS.DOCUMENT_TYPE,
        critical: false,
        extnValue: docType.toBER(false),
        parsedValue: docType,
      }),
      new Extension({
        extnID: X502_OIDS.EXTENDED_KEY_USAGE,
        critical: false,
        extnValue: extKeyUsage.toSchema().toBER(false),
        parsedValue: extKeyUsage,
      }),
    ];

    cert.subjectPublicKeyInfo = csr.subjectPublicKeyInfo;
    await cert.sign(this.privateKey, 'SHA-256');
    const packed = Buffer.from(await cert.toSchema().toBER(false));
    return pem(packed, 'CERTIFICATE');
  }
}
