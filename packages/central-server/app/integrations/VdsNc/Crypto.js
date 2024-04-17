import config from 'config';
import crypto from 'crypto';
import { canonicalize } from 'json-canonicalize';

/**
 * Issue a signature from some data.
 *
 * @internal
 * @param {object} data Arbitrary data to sign.
 * @returns {Promise<{ algorithm: string, signature: Buffer }>} The signature and algorithm.
 */
export async function issueVdsNcSignature(data, { models }) {
  const signer = await models.Signer.findActive();
  if (!signer) {
    throw new Error('Cannot issue signature, no active signer');
  }

  const privateKey = signer.decryptPrivateKey(config.integrations.signer.keySecret);
  const canonData = Buffer.from(canonicalize(data), 'utf8');
  const sign = crypto.createSign('SHA256');
  sign.update(canonData);
  sign.end();
  const signature = sign.sign({
    key: privateKey,
    dsaEncoding: 'ieee-p1363',
  });

  await signer.increment('signaturesIssued');

  return {
    algorithm: 'ES256',
    signature,
  };
}
