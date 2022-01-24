import config from 'config';
import nodeCrypto from 'crypto';
import { Crypto } from 'node-webcrypto-ossl';
import { fromBER, PrintableString, Utf8String } from 'asn1js';
import { setEngine, CryptoEngine, Certificate, CertificationRequest, AttributeTypeAndValue } from 'pkijs';
import { X502_OIDS } from 'shared/constants';

const webcrypto = new Crypto;
setEngine('webcrypto', webcrypto, new CryptoEngine({ name: 'webcrypto', crypto: webcrypto, subtle: webcrypto.subtle }));

/**
 * Generate a VDS-NC Barcode Signer compliant keypair and CSR.
 *
 * @param {object} keygenConfig The keySecret and the icao.csr fields.
 * @returns The fields to use to create the Signer model.
 */
export async function newKeypairAndCsr(keygenConfig = {
  keySecret: config.icao.keySecret,
  ...config.icao.csr,
}) {
  const { publicKey, privateKey } = await webcrypto.subtle.generateKey({
    name: 'ECDSA',
    namedCurve: 'P-256',
  }, true, ['sign', 'verify']);

  const { keySecret, countryCode, commonName } = keygenConfig;

  const csr = new CertificationRequest();
  csr.version = 0;
  csr.subject.typesAndValues.push(
    new AttributeTypeAndValue({
      type: X502_OIDS.COUNTRY_NAME,
      value: new PrintableString({ value: countryCode }),
    }),
  );
  csr.subject.typesAndValues.push(
    new AttributeTypeAndValue({
      type: X502_OIDS.COMMON_NAME,
      value: new Utf8String({ value: commonName }),
    }),
  );

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
    countryCode,
    publicKey: fakeABtoRealAB(await webcrypto.subtle.exportKey('spki', publicKey)),
    privateKey: fakeABtoRealAB(privateNodeKey.export({
      type: 'pkcs8',
      format: 'der',
      cipher: 'aes-256-cbc',
      passphrase,
    }).buffer),
    request: `-----BEGIN CERTIFICATE REQUEST-----\n${packedCsr.toString(
      'base64',
    )}\n-----END CERTIFICATE REQUEST-----`,
  };
}

/**
 * Load the signed certificate from the CSCA.
 *
 * @param {string} certificate The signed certificate from the CSCA.
 * @returns {object} The fields to load into the relevant Signer.
 */
export function loadCertificateIntoSigner(certificate) {
  let binCert;
  let txtCert;
  if (typeof certificate === 'string') {
    if (!certificate.trimStart().startsWith('-----BEGIN CERTIFICATE-----')) {
      throw new Error('Certificate must be in PEM format');
    }

    binCert = Buffer.from(certificate.replace(/^--.+$/gm).trim(), 'base64');
    txtCert = certificate;
  } else if (Buffer.isBuffer(certificate)) {
    binCert = certificate;
    txtCert = `-----BEGIN CERTIFICATE-----\n${certificate.toString(
      'base64',
    )}\n-----END CERTIFICATE-----`;
  } else {
    throw new Error('Certificate must be a string (PEM) or Buffer (DER).');
  }

  const cert = new Certificate({ schema: fromBER(binCert).result });
  return {
    notAfter: cert.notAfter.value,
    notBefore: cert.notBefore.value,
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
 * @param {ArrayBuffer} fake The fake ArrayBuffer.
 * @returns {ArrayBuffer} The real ArrayBuffer.
 */
export function fakeABtoRealAB(fake) {
  return Uint8Array.from((new Uint8Array(fake)).values()).buffer;
}
