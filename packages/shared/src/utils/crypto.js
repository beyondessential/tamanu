import config from 'config';
import { get as lodashGet } from 'lodash';
import { promises as fs } from 'fs';

// Secret format version prefix
const SECRET_VERSION = 'S1';

// AES-GCM configuration
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits recommended for AES-GCM

/**
 * Generates a new secret key for encryption.
 * @returns {Promise<Buffer>}
 */
export async function generateSecretKey() {
  const key = await crypto.subtle.generateKey(
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true, // extractable
    ['encrypt', 'decrypt'],
  );

  const exported = await crypto.subtle.exportKey('raw', key);
  return Buffer.from(exported);
}

/**
 * Imports a raw key buffer into a CryptoKey.
 * @param {Buffer} keyBuffer
 * @returns {Promise<CryptoKey>}
 */
async function importKey(keyBuffer) {
  return crypto.subtle.importKey('raw', keyBuffer, { name: ALGORITHM, length: KEY_LENGTH }, false, [
    'encrypt',
    'decrypt',
  ]);
}

/**
 * Encrypts a plaintext string and returns an encoded secret string.
 * @param {Buffer} keyBuffer
 * @param {string} plaintext
 * @returns {Promise<string>}
 */
export async function encryptSecret(keyBuffer, plaintext) {
  const key = await importKey(keyBuffer);

  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Encrypt the plaintext
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv,
    },
    key,
    plaintextBytes,
  );

  // Encode IV and ciphertext as base64
  const ivBase64 = Buffer.from(iv).toString('base64');
  const ciphertextBase64 = Buffer.from(ciphertext).toString('base64');

  return `${SECRET_VERSION}:${ivBase64}:${ciphertextBase64}`;
}

/**
 * Decrypts an encoded secret string back to plaintext.
 * @param {Buffer} keyBuffer
 * @param {string} encrypted
 * @returns {Promise<string>}
 */
export async function decryptSecret(keyBuffer, encrypted) {
  const parts = encrypted.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted secret format: expected S1:{iv}:{ciphertext}');
  }

  const [version, ivBase64, ciphertextBase64] = parts;

  if (version !== SECRET_VERSION) {
    throw new Error(`Unsupported secret version: ${version}`);
  }

  const key = await importKey(keyBuffer);
  const iv = Buffer.from(ivBase64, 'base64');
  const ciphertext = Buffer.from(ciphertextBase64, 'base64');

  const decrypted = await crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv,
    },
    key,
    ciphertext,
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Reads a key file from the filesystem.
 * @param {string} keyFilePath
 * @returns {Promise<Buffer>}
 */
export async function readKeyFile(keyFilePath) {
  const keyContent = await fs.readFile(keyFilePath);
  // The key file contains raw binary key data
  return keyContent;
}

/**
 * Writes a key to a file.
 * @param {string} keyFilePath
 * @param {Buffer} key
 * @returns {Promise<void>}
 */
export async function writeKeyFile(keyFilePath, key) {
  await fs.writeFile(keyFilePath, new Uint8Array(key), { mode: 0o600 });
}

/**
 * Gets a decrypted secret from the config at the specified path.
 * @param {string} name
 * @returns {Promise<string>}
 */
export async function getConfigSecret(name) {
  const keyFilePath = config.get('crypto.keyFile');
  if (!keyFilePath) {
    throw new Error('crypto.keyFile is not configured');
  }

  const encryptedValue = lodashGet(config, name);
  if (!encryptedValue) {
    throw new Error(`Config value not found at path: ${name}`);
  }

  const keyBuffer = await readKeyFile(keyFilePath);
  return decryptSecret(keyBuffer, encryptedValue);
}

/**
 * Check if a value looks like an encrypted secret.
 * @param {string} value
 * @returns {boolean}
 */
export function isEncryptedSecret(value) {
  if (typeof value !== 'string') return false;
  const parts = value.split(':');
  return parts.length === 3 && parts[0] === SECRET_VERSION;
}

/**
 * CLI helper: Initialize a new key file for config secret encryption.
 * @returns {Promise<string>}
 */
export async function initConfigSecretKeyFile() {
  let keyFilePath;
  try {
    keyFilePath = config.get('crypto.keyFile');
  } catch {
    throw new Error(
      'crypto.keyFile is not configured. Please set it in your config file before running init.',
    );
  }

  if (!keyFilePath) {
    throw new Error(
      'crypto.keyFile is not configured. Please set it in your config file before running init.',
    );
  }

  // Check if file already exists
  try {
    await fs.access(keyFilePath);
    throw new Error(
      `Key file already exists at ${keyFilePath}. Remove it first if you want to regenerate.`,
    );
  } catch (err) {
    // File doesn't exist, which is what we want
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

  const key = await generateSecretKey();
  await writeKeyFile(keyFilePath, key);

  return keyFilePath;
}

/**
 * CLI helper: Encrypt a value using the configured key file.
 * @param {string} plaintext
 * @returns {Promise<string>}
 */
export async function encryptConfigValue(plaintext) {
  let keyFilePath;
  try {
    keyFilePath = config.get('crypto.keyFile');
  } catch {
    throw new Error('crypto.keyFile is not configured');
  }

  if (!keyFilePath) {
    throw new Error('crypto.keyFile is not configured');
  }

  const keyBuffer = await readKeyFile(keyFilePath);
  return encryptSecret(keyBuffer, plaintext);
}
