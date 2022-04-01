import prompts from 'prompts';
import crypto from './crypto';

export function enumFromStringValue<T>(enm: { [s: string]: T }, value: string): T {
  if (!((Object.values(enm) as unknown) as string[]).includes(value)) {
    throw new Error(`Invalid value: ${value}`);
  }

  return (value as unknown) as T;
}

export function enumValues<T>(enm: { [s: string]: T }): T[] {
  return Object.values(enm) as T[];
}

// https://www.rfc-editor.org/rfc/rfc7518#section-6.2
export async function keyPairFromPrivate(privateKey: CryptoKey): Promise<CryptoKeyPair> {
  const { alg, crv, ext, key_ops, kty, x, y } = await crypto.subtle.exportKey('jwk', privateKey);
  const publicKey = await crypto.subtle.importKey(
    'jwk',
    { alg, crv, ext, key_ops, kty, x, y },
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify'],
  );

  return { publicKey, privateKey };
}

export async function confirm(message: string) {
  const { value } = await prompts({
    type: 'confirm',
    name: 'value',
    message,
  });

  if (!value) {
    throw new Error('Aborted');
  }
}

/**
 * Pads the start of the buffer with zeros to the desired length.
 *
 * If the buffer is already longer than the desired length, a copy of it is returned.
 */
export function padBufferStart(buffer: Buffer, bytes: number): Buffer {
  const padding = bytes - buffer.byteLength;
  if (padding > 0) {
    return Buffer.concat([Buffer.alloc(padding), buffer]);
  } else {
    return Buffer.from(buffer);
  }
}
