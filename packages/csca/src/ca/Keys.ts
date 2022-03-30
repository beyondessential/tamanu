import { promises as fs } from 'fs';

import crypto from '../crypto';

// Layout:
// 12-byte IV
// rest of it is AES-GCM wrapping a JWK
const PRIVATE_KEY_LAYOUT_SCHEMA = 1;

// It may be better to use AES-KW, but that's only supported by OpenSSL 3.

export async function writePrivateKey(
  path: string,
  privateKey: CryptoKey,
  encryptionKey: CryptoKey,
) {
  const schema = new Uint8Array([PRIVATE_KEY_LAYOUT_SCHEMA]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const wrapped = await crypto.subtle.wrapKey('jwk', privateKey, encryptionKey, {
    name: 'AES-GCM',
    iv,
  });

  const data = Buffer.concat([schema, iv, Buffer.from(wrapped)]);
  await fs.writeFile(path, data);
}

export async function readPrivateKey(path: string, encryptionKey: CryptoKey): Promise<CryptoKey> {
  const data = await fs.readFile(path);
  const schema = data.slice(0, 1);
  if (schema[0] !== PRIVATE_KEY_LAYOUT_SCHEMA)
    throw new Error(`Invalid private key file: schema ${schema[0]} not supported`);

  const iv = data.slice(1, 13);
  const wrapped = data.slice(13);
  return await crypto.subtle.unwrapKey(
    'jwk',
    wrapped,
    encryptionKey,
    {
      name: 'AES-GCM',
      iv,
    },
    {
      name: 'AES-GCM',
    },
    true,
    ['sign', 'verify'],
  );
}

export async function writePublicKey(path: string, publicKey: CryptoKey) {
  const key = await crypto.subtle.exportKey('spki', publicKey);
  await fs.writeFile(path, Buffer.from(key));
}

export async function readPublicKey(path: string): Promise<CryptoKey> {
  const key = await fs.readFile(path);
  return await crypto.subtle.importKey('spki', key, { name: 'ECDSA', namedCurve: 'P-256' }, true, [
    'sign',
    'verify',
  ]);
}
