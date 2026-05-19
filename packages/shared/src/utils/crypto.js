import config from 'config';
import { get as lodashGet } from 'lodash';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import readSync from 'read';

const read = promisify(readSync);

const SECRET_VERSION = 'S1';

/**
 * Thrown when a secret is not present at the requested path. Distinct from
 * decryption / format errors so callers can fall back through credential
 * sources without swallowing real failures.
 */
export class SecretNotConfiguredError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SecretNotConfiguredError';
  }
}

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const KEY_LENGTH_BYTES = KEY_LENGTH / 8;
const IV_LENGTH = 12;

/** Generates a new raw AES-256 key. */
export async function generateSecretKey() {
  const key = await crypto.subtle.generateKey(
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    ['encrypt', 'decrypt'],
  );

  const exported = await crypto.subtle.exportKey('raw', key);
  return Buffer.from(exported);
}

async function importKey(keyBuffer) {
  if (keyBuffer.length !== KEY_LENGTH_BYTES) {
    throw new Error(
      `Key must be exactly ${KEY_LENGTH_BYTES} bytes (got ${keyBuffer.length})`,
    );
  }
  return crypto.subtle.importKey('raw', keyBuffer, { name: ALGORITHM }, false, [
    'encrypt',
    'decrypt',
  ]);
}

/** Encrypts a plaintext string into a versioned, base64-encoded secret. */
export async function encryptSecret(keyBuffer, plaintext) {
  const key = await importKey(keyBuffer);

  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const plaintextBytes = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv,
    },
    key,
    plaintextBytes,
  );

  const ivBase64 = Buffer.from(iv).toString('base64');
  const ciphertextBase64 = Buffer.from(ciphertext).toString('base64');

  return `${SECRET_VERSION}:${ivBase64}:${ciphertextBase64}`;
}

/** Decrypts a versioned, base64-encoded secret back to plaintext. */
export async function decryptSecret(keyBuffer, encrypted) {
  const parts = encrypted.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted secret format: expected S1:{iv}:{ciphertext}');
  }

  const [version, ivBase64, ciphertextBase64] = parts;

  if (version !== SECRET_VERSION) {
    throw new Error(`Unsupported secret version: ${version}`);
  }

  const iv = Buffer.from(ivBase64, 'base64');
  if (iv.length !== IV_LENGTH) {
    throw new Error('Decryption failed');
  }

  const ciphertext = Buffer.from(ciphertextBase64, 'base64');
  if (ciphertext.length === 0) {
    throw new Error('Decryption failed');
  }

  const key = await importKey(keyBuffer);

  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv,
      },
      key,
      ciphertext,
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    // Wrap WebCrypto's DOMException so we don't leak distinguishing details
    // (wrong key vs. tampered ciphertext vs. AAD mismatch) to callers.
    throw new Error('Decryption failed');
  }
}

export async function readKeyFile(keyFilePath) {
  const keyContent = await fs.readFile(keyFilePath);
  if (keyContent.length !== KEY_LENGTH_BYTES) {
    throw new Error(
      `Key file at ${keyFilePath} must be exactly ${KEY_LENGTH_BYTES} bytes (got ${keyContent.length})`,
    );
  }
  return keyContent;
}

export async function writeKeyFile(keyFilePath, key) {
  await fs.writeFile(keyFilePath, new Uint8Array(key), { mode: 0o600 });
}

/** Reads and decrypts a secret from the config at the given lodash path. */
export async function getConfigSecret(name) {
  const encryptedValue = lodashGet(config, name);
  if (!encryptedValue) {
    throw new SecretNotConfiguredError(`Config value not found at path: ${name}`);
  }
  // Plaintext at this path is treated as "no config secret configured" so
  // callers using a fallback chain (e.g. settings → config secret → plaintext)
  // can fall through cleanly without surfacing a decryption error.
  if (!isEncryptedSecret(encryptedValue)) {
    throw new SecretNotConfiguredError(
      `Config value at ${name} is not an encrypted secret`,
    );
  }

  const keyFilePath = getConfigKeyFilePath();
  const keyBuffer = await readKeyFile(keyFilePath);
  return decryptSecret(keyBuffer, encryptedValue);
}

// The settings PSK key never changes at runtime so we decrypt it once and
// reuse the buffer. A failed first read clears the cache so the next call
// retries instead of permanently breaking secret access.
let settingsPskKeyBufferPromise = null;

export async function getSettingsPskKeyBuffer() {
  if (!settingsPskKeyBufferPromise) {
    settingsPskKeyBufferPromise = (async () => {
      const psk = await getConfigSecret('crypto.settingsPsk');
      return Buffer.from(psk, 'hex');
    })().catch(err => {
      settingsPskKeyBufferPromise = null;
      throw err;
    });
  }
  return settingsPskKeyBufferPromise;
}

/** Reads and decrypts a secret stored in the settings table. */
export async function getSettingSecret(settings, name) {
  const encryptedValue = await settings.get(name);
  if (!encryptedValue || typeof encryptedValue !== 'string') {
    throw new SecretNotConfiguredError(`Secret setting not found: ${name}`);
  }
  if (!isEncryptedSecret(encryptedValue)) {
    throw new Error(
      `Setting at ${name} is not encrypted; re-save it via the admin UI to encrypt it`,
    );
  }

  const keyBuffer = await getSettingsPskKeyBuffer();
  return decryptSecret(keyBuffer, encryptedValue);
}

/** Returns true if `value` looks like an encrypted secret produced by encryptSecret. */
export function isEncryptedSecret(value) {
  if (typeof value !== 'string') return false;
  const parts = value.split(':');
  return parts.length === 3 && parts[0] === SECRET_VERSION;
}

/** Single source of truth for resolving the configured key file path. */
export function getConfigKeyFilePath() {
  const keyFilePath = config.get('crypto.keyFile');

  if (!keyFilePath) {
    throw new Error('crypto.keyFile is not configured');
  }

  return keyFilePath;
}

/** CLI helper: create a new key file. Throws if one already exists. */
export async function initConfigSecretKeyFile() {
  const keyFilePath = getConfigKeyFilePath();

  try {
    await fs.access(keyFilePath);
    throw new Error(
      `Key file already exists at ${keyFilePath}. Remove it first if you want to regenerate.`,
    );
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

  const key = await generateSecretKey();
  await writeKeyFile(keyFilePath, key);

  return keyFilePath;
}

/** CLI helper: encrypt a value with the configured key file. */
export async function encryptConfigValue(plaintext) {
  const keyFilePath = getConfigKeyFilePath();
  const keyBuffer = await readKeyFile(keyFilePath);
  return encryptSecret(keyBuffer, plaintext);
}

/** CLI action: create a key file and optionally encrypt a settings PSK. */
export async function configSecretInitAction(stdout, stderr) {
  const keyFilePath = await initConfigSecretKeyFile();
  stderr.write(`Successfully created key file at: ${keyFilePath}\n`);
  stderr.write('Keep this file secure and back it up safely.\n');
  stderr.write('You will need it to decrypt any secrets encrypted with it.\n\n');

  const expectedHexLength = KEY_LENGTH_BYTES * 2;

  const settingsPsk = await read({
    prompt: `Enter settings PSK as hex (${expectedHexLength} hex chars, leave empty to skip): `,
    silent: true,
    replace: '*',
  });

  let settingsPskLine = '';
  if (settingsPsk) {
    if (!/^[0-9a-fA-F]+$/.test(settingsPsk)) {
      throw new Error('Settings PSK must be a hexadecimal string');
    }

    if (settingsPsk.length !== expectedHexLength) {
      throw new Error(
        `Settings PSK must be exactly ${expectedHexLength} hex characters (${KEY_LENGTH_BYTES} bytes for AES-${KEY_LENGTH}), got ${settingsPsk.length}`,
      );
    }

    const keyBuffer = await readKeyFile(keyFilePath);
    const encryptedPsk = await encryptSecret(keyBuffer, settingsPsk);
    settingsPskLine = `\n  settingsPsk: ${JSON.stringify(encryptedPsk)},`;
  }

  stderr.write('\nAdd this to your config file:\n\n');
  stdout.write(`crypto: {\n  keyFile: ${JSON.stringify(keyFilePath)},${settingsPskLine}\n},\n`);
}

/** CLI action: encrypt a single value with the configured key file. */
export async function configSecretEncryptAction(stdout, stderr) {
  const value = await read({
    prompt: 'Enter value to encrypt: ',
    silent: true,
    replace: '*',
  });

  if (!value) {
    throw new Error('No value provided');
  }

  const encrypted = await encryptConfigValue(value);
  stderr.write('Encrypted value (copy this to your config):\n');
  stdout.write(`${encrypted}\n`);
}
