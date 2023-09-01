import { setMilliseconds } from 'date-fns';
import { promises as fs } from 'fs';
import prompts from 'prompts';

import crypto from './crypto';

export function enumFromStringValue<T>(enm: { [s: string]: T }, value: string): T {
  if (!(Object.values(enm) as unknown as string[]).includes(value)) {
    throw new Error(`Invalid value: ${value}`);
  }

  return value as unknown as T;
}

export function enumValues<T>(enm: { [s: string]: T }): T[] {
  return Object.values(enm) as T[];
}

// https://www.rfc-editor.org/rfc/rfc7518#section-6.2
export async function keyPairFromPrivate(privateKey: CryptoKey): Promise<CryptoKeyPair> {
  /* eslint-disable camelcase, @typescript-eslint/camelcase */
  const { alg, crv, ext, key_ops, kty, x, y } = await crypto.subtle.exportKey('jwk', privateKey);
  const publicKey = await crypto.subtle.importKey(
    'jwk',
    { alg, crv, ext, key_ops, kty, x, y },
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify'],
  );
  /* eslint-enable camelcase, @typescript-eslint/camelcase */

  return { publicKey, privateKey };
}

export async function confirm(message: string): Promise<void> {
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
  }

  return Buffer.from(buffer);
}

/**
 * Truncate a date's precision to seconds, removing milliseconds.
 *
 * Certificate dates are only precise to seconds, and will get stored
 * appropriately, but when we use dates generated at runtime we
 * sometimes want to truncate them so they're consistent with
 * certificate-extracted dates.
 */
export function truncateToSeconds(date: Date): Date {
  return setMilliseconds(date, 0);
}

export async function fsExists(path: string): Promise<boolean> {
  try {
    await fs.stat(path);
    return true;
  } catch (_) {
    return false;
  }
}

export function numberToBuffer(num: number): Buffer {
  let numHex = num.toString(16);
  const numHexLen = numHex.length;
  numHex = numHex.padStart(numHexLen % 2 === 0 ? numHexLen : numHexLen + 1, '0');
  return Buffer.from(numHex, 'hex');
}
