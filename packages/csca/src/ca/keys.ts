import { promises as fs } from 'fs';

import { PemConverter } from '@peculiar/x509';

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
): Promise<void> {
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
  return crypto.subtle.unwrapKey(
    'jwk',
    wrapped,
    encryptionKey,
    {
      name: 'AES-GCM',
      iv,
    },
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['sign', 'verify'],
  );
}

export async function makeKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['sign', 'verify'],
  );
}

export async function writePublicKey(path: string, publicKey: CryptoKey): Promise<void> {
  const key = await crypto.subtle.exportKey('spki', publicKey);
  const pem = PemConverter.encode(key, 'PUBLIC KEY');

  await fs.writeFile(path, Buffer.from(pem, 'utf-8'));
}

export async function readPublicKey(path: string): Promise<CryptoKey> {
  const pem = await fs.readFile(path);
  const keys = PemConverter.decode(pem.toString('utf-8'));
  if (keys.length !== 1) throw new Error('Invalid public key file: exactly one PEM block expected');

  return crypto.subtle.importKey(
    'spki',
    Buffer.from(keys[0]),
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify'],
  );
}

export async function deriveSymmetricKey(
  passphrase: string,
  salt: Buffer,
  iterations: number,
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const raw = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    raw,
    { name: 'AES-GCM', length: 256 },
    true,
    ['wrapKey', 'unwrapKey'],
  );
}
