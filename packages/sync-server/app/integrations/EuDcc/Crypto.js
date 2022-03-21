import { log } from 'shared/services/logging';
import crypto from 'crypto';
import cbor from 'cbor';
import cose from 'cose-js';
import { fromBER } from 'asn1js';
import { deflateSync, inflateSync } from 'zlib';
import base45 from 'base45-js';
import { ECPublicKey, Certificate } from 'pkijs';
import { depem } from 'shared/utils';
// TODO: Move this function somewhere more generic
import { fakeABtoRealAB } from '../VdsNc';

function extractKeyD(keyData) {
  const asn = fromBER(fakeABtoRealAB(keyData.export({ type: 'pkcs8', format: 'der' }).buffer));
  if (asn.result.error !== '') {
    throw new Error(asn.result.error);
  }
  const [, , octetString] = asn.result.valueBlock.value;
  const [octetSequence] = octetString.valueBlock.value;
  const [, privateKey] = octetSequence.valueBlock.value;
  return Buffer.from(privateKey.valueBlock.valueHex, 'hex');
}

function extractKeyXY(keyData) {
  const asn = fromBER(fakeABtoRealAB(keyData));
  if (asn.result.error !== '') {
    throw new Error(asn.result.error);
  }
  const publicKey = new ECPublicKey({ schema: asn.result });
  return { keyX: publicKey.X, keyY: publicKey.Y };
}

export async function HCERTPack(messageData, keySecret, models) {
  log.info('HCERT Packing message data');
  const signer = await models.VdsNcSigner.findActive();
  const privateKey = crypto.createPrivateKey({
    key: Buffer.from(signer.privateKey),
    format: 'der',
    type: 'pkcs8',
    passphrase: Buffer.from(keySecret, 'base64'),
  });

  const cborData = cbor.encode(messageData);
  // p - protected
  // u - unprotected
  const coseHeaders = {
    p: { alg: 'ES256', kid: signer.id },
    u: {},
  };
  const coseSigner = {
    key: {
      d: extractKeyD(privateKey),
    },
  };

  const signedData = await cose.sign.create(coseHeaders, cborData, coseSigner);
  const deflatedBuf = deflateSync(signedData);
  return `HC1:${base45.encode(deflatedBuf)}`;
}

export async function HCERTVerify(packedData, models) {
  log.info('Verifying HCERT message');
  const signer = await models.VdsNcSigner.findActive();

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
  const inflatedData = inflateSync(decodedData);
  const verifiedData = await cose.sign.verifySync(inflatedData, verifier);

  return cbor.decode(verifiedData);
}
