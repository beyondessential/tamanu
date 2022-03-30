import { promises as fs } from 'fs';

import crypto from '../crypto';

export async function writePrivateKey(
  path: string,
  privateKey: CryptoKey,
  encryptionKey: CryptoKey,
) {
  const wrapped = await crypto.subtle.wrapKey('pkcs8', privateKey, encryptionKey, 'AES-KW');
  await fs.writeFile(path, Buffer.from(wrapped));
}

export async function readPrivateKey(path: string, encryptionKey: CryptoKey): Promise<CryptoKey> {
  const wrapped = await fs.readFile(path);
  return await crypto.subtle.unwrapKey('pkcs8', wrapped, encryptionKey, 'AES-KW', 'AES-GCM', true, [
    'sign',
    'verify',
  ]);
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
