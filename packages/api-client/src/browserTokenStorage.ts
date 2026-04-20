const ENCRYPTED_PREFIX = 'tamanuenc1.';

const PBKDF2_SALT = new TextEncoder().encode('tamanu-local-storage-token-v1');
const PBKDF2_ITERATIONS = 100_000;

export type TokenStorageNamespace = 'webapp' | 'patient-portal';

function requireSubtle(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error(
      'Web Crypto API is unavailable; use HTTPS or localhost for encrypted token storage.',
    );
  }
  return subtle;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '===='.slice(b64.length % 4);
  const binary = atob(b64 + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)!;
  }
  return bytes;
}

async function deriveAesKey(password: string): Promise<CryptoKey> {
  const subtle = requireSubtle();
  const passwordKey = await subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: PBKDF2_SALT,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export function buildTokenStorageKeyMaterial(
  deviceId: string,
  origin: string,
  namespace: TokenStorageNamespace,
): string {
  return `${namespace}\0${origin}\0${deviceId}`;
}

/** Minimal storage surface (e.g. `localStorage`) for tests or non-browser use. */
export interface AuthTokenStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function defaultOrigin(): string {
  return typeof globalThis.location !== 'undefined' ? globalThis.location.origin : '';
}

/**
 * Encrypt and store an API token, or remove the key when `token` is empty.
 */
export async function writePersistedAuthToken(
  storageKey: string,
  token: string,
  deviceId: string,
  namespace: TokenStorageNamespace,
  storage: AuthTokenStorage = localStorage,
  origin: string = defaultOrigin(),
): Promise<void> {
  const keyMaterial = buildTokenStorageKeyMaterial(deviceId, origin, namespace);
  if (token) {
    storage.setItem(storageKey, await packPersistedToken(token, keyMaterial));
  } else {
    storage.removeItem(storageKey);
  }
}

/**
 * Read and decrypt a stored token. Removes the key if ciphertext is present but invalid.
 */
export async function readPersistedAuthToken(
  storageKey: string,
  deviceId: string,
  namespace: TokenStorageNamespace,
  storage: AuthTokenStorage = localStorage,
  origin: string = defaultOrigin(),
): Promise<{ raw: string | null; token: string | null }> {
  const raw = storage.getItem(storageKey);
  if (raw == null || raw === '') {
    return { raw: null, token: null };
  }
  const keyMaterial = buildTokenStorageKeyMaterial(deviceId, origin, namespace);
  const token = await unpackPersistedToken(raw, keyMaterial);
  if (token == null) {
    storage.removeItem(storageKey);
    return { raw, token: null };
  }
  return { raw, token };
}

export async function packPersistedToken(token: string, keyMaterial: string): Promise<string> {
  if (!token) {
    return token;
  }
  const aesKey = await deriveAesKey(keyMaterial);
  const iv = new Uint8Array(12);
  globalThis.crypto.getRandomValues(iv);
  const plaintext = new TextEncoder().encode(token);
  const ciphertext = await requireSubtle().encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    aesKey,
    plaintext,
  );
  const ct = new Uint8Array(ciphertext);
  const combined = new Uint8Array(iv.length + ct.length);
  combined.set(iv, 0);
  combined.set(ct, iv.length);
  return `${ENCRYPTED_PREFIX}${toBase64Url(combined)}`;
}

export async function unpackPersistedToken(
  stored: string | null | undefined,
  keyMaterial: string,
): Promise<string | null> {
  if (stored == null || stored === '') {
    return null;
  }
  if (!stored.startsWith(ENCRYPTED_PREFIX)) {
    return stored;
  }
  let combined: Uint8Array;
  try {
    combined = fromBase64Url(stored.slice(ENCRYPTED_PREFIX.length));
  } catch {
    return null;
  }
  if (combined.length < 13) {
    return null;
  }
  const iv = combined.subarray(0, 12);
  const ciphertext = combined.subarray(12);
  const aesKey = await deriveAesKey(keyMaterial);
  try {
    const plaintext = await requireSubtle().decrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      aesKey,
      ciphertext as BufferSource,
    );
    return new TextDecoder().decode(plaintext);
  } catch {
    return null;
  }
}
