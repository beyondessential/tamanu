import config from 'config';
import crypto from 'crypto';
import cbor from 'cbor';
import cose from 'cose-js';
import { log } from 'shared/services/logging';
import { fromBER } from 'asn1js';
import { deflate as deflateCallback, inflate as inflateCallback } from 'zlib';
import { promisify } from 'util';
import base45 from 'base45-js';
import { Certificate } from 'pkijs';
import { depem } from 'shared/utils';
import { fakeABtoRealAB } from '../Signer';

const deflate = promisify(deflateCallback);
const inflate = promisify(inflateCallback);

/**
 *  Fetches the actual 32 byte privateKey from within the structured privateKey data
 *
 *  @returns 32-byte buffer with the privateKey value
 */
function extractKeyD(keyData) {
  const asn = fromBER(fakeABtoRealAB(keyData.export({ type: 'pkcs8', format: 'der' }).buffer));
  if (asn.result.error !== '') {
    throw new Error(asn.result.error);
  }
  const [, , octetString] = asn.result.valueBlock.value;
  const [octetSequence] = octetString.valueBlock.value;
  const [, privateKey] = octetSequence.valueBlock.value;
  if (privateKey.valueBlock.blockLength !== 32) {
    throw new Error(`Private key block length ${privateKey.valueBlock.blockLength} instead of 32`);
  }
  return Buffer.from(privateKey.valueBlock.valueHex, 'hex');
}

/**
 *  Packs a JSON object according to HCERT specs
 *
 *  - Convert to CBOR
 *  - Sign and encode with COSE
 *  - Compress with zlib
 *  - Encode in base45
 *
 *  @returns The HCERT encoded data
 */
export async function HCERTPack(messageData, models) {
  log.info('HCERT Packing message data');
  const signer = await models.Signer.findActive();

  const cborData = cbor.encode(messageData);
  // p - protected
  // u - unprotected
  const coseHeaders = {
    p: { alg: 'ES256', kid: signer.id },
    u: {},
  };
  const coseSigner = {
    key: {
      d: extractKeyD(signer.decryptPrivateKey(config.integrations.signer.keySecret)),
    },
  };

  const signedData = await cose.sign.create(coseHeaders, cborData, coseSigner);
  signer.increment('signaturesIssued');
  const deflatedBuf = await deflate(signedData);
  return `HC1:${base45.encode(deflatedBuf)}`;
}

/**
 *  Unpacks HCERT data, and verifies the COSE signature
 *
 *  @returns The decoded JSON data
 */
export async function HCERTVerify(packedData, models) {
  log.info('Verifying HCERT message');
  const signer = await models.Signer.findActive();

  // Fetch publicKey data from cert
  // Parsing the publicKey field directly seems to go wonky
  const cert = depem(signer.certificate, 'CERTIFICATE');
  const asn = fromBER(fakeABtoRealAB(cert));
  const certificate = new Certificate({ schema: asn.result });

  const verifier = {
    key: {
      x: Buffer.from(certificate.subjectPublicKeyInfo.parsedKey.x),
      y: Buffer.from(certificate.subjectPublicKeyInfo.parsedKey.y),
      kid: signer.id,
    },
  };

  // Strip HC1: header
  if (!packedData.startsWith('HC1:')) {
    log.error('No HC1 header detected in HCERT data');
    throw new Error('No HC1 header detected in HCERT data');
  }
  const strippedData = packedData.substring(4);
  const decodedData = base45.decode(strippedData);
  const inflatedData = await inflate(decodedData);
  const verifiedData = await cose.sign.verify(inflatedData, verifier);

  return cbor.decode(verifiedData);
}
