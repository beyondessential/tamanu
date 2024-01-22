import config from 'config';
import cbor from 'cbor';
import cose from 'cose-js';
import { log } from '@tamanu/shared/services/logging';
import { fromBER } from 'asn1js';
import { deflate as deflateCallback, inflate as inflateCallback } from 'zlib';
import { promisify } from 'util';
import base45 from 'base45-js';
import { Certificate } from 'pkijs';
import { depem } from '@tamanu/shared/utils';
import { add, getUnixTime } from 'date-fns';
import { fakeABtoRealAB } from '../Signer';
import { getLocalisation } from '../../localisation';

const deflate = promisify(deflateCallback);
const inflate = promisify(inflateCallback);

const EUDGC_IN_HCERT_KEY = 1;
const CWT_CLAIM_KEYS = {
  iss: 1,
  exp: 4,
  iat: 6,
  hcert: -260,
};

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
 *  - Wrap in CWT
 *  - Convert to CBOR
 *  - Sign and encode with COSE
 *  - Compress with zlib
 *  - Encode in base45
 *
 *  @returns The HCERT encoded data
 */
export async function HCERTPack(messageData, { models }) {
  log.info('HCERT Packing message data');
  const signer = await models.Signer.findActive();
  if (!signer) {
    throw new Error('Cannot pack HCERT, no active signer');
  }

  const iss = (await getLocalisation()).country['alpha-2'];
  const iat = new Date();
  const exp = add(iat, { days: 365 });

  const hcert = new Map();
  hcert.set(EUDGC_IN_HCERT_KEY, messageData);

  const payload = new Map();
  payload.set(CWT_CLAIM_KEYS.iss, iss);
  payload.set(CWT_CLAIM_KEYS.iat, getUnixTime(iat));
  payload.set(CWT_CLAIM_KEYS.exp, getUnixTime(exp));
  payload.set(CWT_CLAIM_KEYS.hcert, hcert);

  const cborData = cbor.encode(payload);

  // p - protected
  // u - unprotected
  const coseHeaders = {
    p: {
      alg: 'ES256',
      kid: signer.id,
    },
    u: {},
  };
  const coseSigner = {
    key: {
      d: extractKeyD(signer.decryptPrivateKey(config.integrations.signer.keySecret)),
    },
  };

  const signedData = await cose.sign.create(coseHeaders, cborData, coseSigner);
  await signer.increment('signaturesIssued');
  const deflatedBuf = await deflate(signedData);
  return `HC1:${base45.encode(deflatedBuf)}`;
}

/**
 * Unpacks QR data, verifies the COSE signature, and checks the HCERT claims.
 *
 * @internal Only used for testing. Makes an assumption that the active
 * signer is the right one, but for production use we should really look
 * for the right signer from the kid.
 *
 * @returns The decoded HCERT data
 */
export async function HCERTVerify(packedData, { models }) {
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

  const payload = cbor.decode(verifiedData);

  if (payload.get(CWT_CLAIM_KEYS.iss) !== (await getLocalisation()).country['alpha-2']) {
    throw new Error('HCERT message issued to wrong country');
  }

  const now = getUnixTime(new Date());
  if (payload.get(CWT_CLAIM_KEYS.iat) > now) {
    throw new Error('HCERT message issued in the future');
  }

  if (payload.get(CWT_CLAIM_KEYS.exp) < now) {
    throw new Error('HCERT message expired');
  }

  const hcert = payload.get(CWT_CLAIM_KEYS.hcert);
  if (!hcert) {
    throw new Error('HCERT message missing hcert claim');
  }

  if (!hcert.has(EUDGC_IN_HCERT_KEY)) {
    throw new Error('HCERT message missing EUDGC claim');
  }

  return hcert.get(EUDGC_IN_HCERT_KEY);
}
