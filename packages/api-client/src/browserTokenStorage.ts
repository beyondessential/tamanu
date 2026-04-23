/**
 * Browser localStorage helpers that encrypt API tokens at rest using Web Crypto (AES-GCM + PBKDF2).
 *
 * Threat model (what this does and does **not** do):
 * - **Addresses**: Static analysis / policy expectations that secrets not be written to storage as
 *   cleartext; casual inspection of profile files without executing app JS; legacy cleartext tokens
 *   are rewritten to ciphertext on first read when crypto is available.
 * - **Does not address**: XSS — `deviceId` and the encrypted blob live in the same origin storage,
 *   and JS can derive the same PBKDF2 inputs, so a script that can read `localStorage` can recover
 *   the token. Stronger mitigation is HttpOnly (+ Secure, SameSite) cookies and server-side session
 *   handling so the access token is not exposed to JavaScript.
 *
 * **Defence in depth / reviewer note:** PR titles or SAST tickets may describe this as “sensitive
 * cookie/storage” hardening. That wording must not be read as **token confidentiality against XSS**:
 * this layer does **not** provide that. The recommended long-term mitigation remains server-issued
 * **HttpOnly + Secure (+ SameSite)** session cookies (and CSRF protections where applicable), with
 * tokens never exposed to `document`/JS — see OWASP session management guidance.
 *
 * @todo Migrate facility web + patient portal auth to HttpOnly cookie sessions where product/security
 *   requirements allow, so XSS cannot exfiltrate bearer tokens via `localStorage` or this module.
 */

const ENCRYPTED_PREFIX_V1 = 'tamanuenc1.';
const ENCRYPTED_PREFIX_V2 = 'tamanuenc2.';

/** Fixed salt for v1 payloads only (backward compatibility). New writes use v2 with random salt. */
const LEGACY_PBKDF2_SALT = new TextEncoder().encode('tamanu-local-storage-token-v1');
/** Used only when decrypting legacy `tamanuenc1.*` blobs (original ship used 100k). */
const LEGACY_PBKDF2_ITERATIONS = 100_000;

/** OWASP Password Storage Cheat Sheet (2023): minimum 600k for PBKDF2-HMAC-SHA256. */
const PBKDF2_ITERATIONS = 600_000;

const SALT_LEN = 16;
const IV_LEN = 12;

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

async function deriveAesKey(
  keyMaterial: string,
  salt: Uint8Array,
  iterations: number = PBKDF2_ITERATIONS,
): Promise<CryptoKey> {
  const subtle = requireSubtle();
  const passwordKey = await subtle.importKey(
    'raw',
    new TextEncoder().encode(keyMaterial),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

function isEncryptedStoredValue(stored: string): boolean {
  return stored.startsWith(ENCRYPTED_PREFIX_V1) || stored.startsWith(ENCRYPTED_PREFIX_V2);
}

async function decryptV1Payload(b64Payload: string, keyMaterial: string): Promise<string | null> {
  let combined: Uint8Array;
  try {
    combined = fromBase64Url(b64Payload);
  } catch {
    return null;
  }
  if (combined.length < IV_LEN + 16) {
    return null;
  }
  try {
    const iv = combined.subarray(0, IV_LEN);
    const ciphertext = combined.subarray(IV_LEN);
    const aesKey = await deriveAesKey(
      keyMaterial,
      LEGACY_PBKDF2_SALT,
      LEGACY_PBKDF2_ITERATIONS,
    );
    const subtle = requireSubtle();
    const plaintext = await subtle.decrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      aesKey,
      ciphertext as BufferSource,
    );
    return new TextDecoder().decode(plaintext);
  } catch {
    return null;
  }
}

async function decryptV2Payload(b64Payload: string, keyMaterial: string): Promise<string | null> {
  let combined: Uint8Array;
  try {
    combined = fromBase64Url(b64Payload);
  } catch {
    return null;
  }
  if (combined.length < SALT_LEN + IV_LEN + 16) {
    return null;
  }
  try {
    const salt = combined.subarray(0, SALT_LEN);
    const iv = combined.subarray(SALT_LEN, SALT_LEN + IV_LEN);
    const ciphertext = combined.subarray(SALT_LEN + IV_LEN);
    const aesKey = await deriveAesKey(keyMaterial, salt);
    const subtle = requireSubtle();
    const plaintext = await subtle.decrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      aesKey,
      ciphertext as BufferSource,
    );
    return new TextDecoder().decode(plaintext);
  } catch {
    return null;
  }
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
 * Legacy cleartext values are migrated to encrypted form on first successful read when Web Crypto is available.
 * Returns only `{ token }` so the pre-migration storage string is never part of the public return value.
 */
export async function readPersistedAuthToken(
  storageKey: string,
  deviceId: string,
  namespace: TokenStorageNamespace,
  storage: AuthTokenStorage = localStorage,
  origin: string = defaultOrigin(),
): Promise<{ token: string | null }> {
  const raw = storage.getItem(storageKey);
  if (raw == null || raw === '') {
    return { token: null };
  }
  const keyMaterial = buildTokenStorageKeyMaterial(deviceId, origin, namespace);
  const token = await unpackPersistedToken(raw, keyMaterial);
  if (token == null) {
    if (isEncryptedStoredValue(raw)) {
      storage.removeItem(storageKey);
    }
    return { token: null };
  }
  if (!isEncryptedStoredValue(raw)) {
    try {
      await writePersistedAuthToken(storageKey, token, deviceId, namespace, storage, origin);
    } catch (e) {
      console.error('[Tamanu] Failed to migrate plaintext auth token to encrypted storage', e);
    }
  }
  return { token };
}

/** New writes use v2 (random PBKDF2 salt per encryption). */
export async function packPersistedToken(token: string, keyMaterial: string): Promise<string> {
  if (!token) {
    return token;
  }
  const subtle = requireSubtle();
  const crypto = globalThis.crypto!;
  const salt = new Uint8Array(SALT_LEN);
  crypto.getRandomValues(salt);
  const aesKey = await deriveAesKey(keyMaterial, salt);
  const iv = new Uint8Array(IV_LEN);
  crypto.getRandomValues(iv);
  const plaintext = new TextEncoder().encode(token);
  const ciphertext = await subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    aesKey,
    plaintext,
  );
  const ct = new Uint8Array(ciphertext);
  const combined = new Uint8Array(SALT_LEN + IV_LEN + ct.length);
  combined.set(salt, 0);
  combined.set(iv, SALT_LEN);
  combined.set(ct, SALT_LEN + IV_LEN);
  return `${ENCRYPTED_PREFIX_V2}${toBase64Url(combined)}`;
}

export async function unpackPersistedToken(
  stored: string | null | undefined,
  keyMaterial: string,
): Promise<string | null> {
  if (stored == null || stored === '') {
    return null;
  }
  if (stored.startsWith(ENCRYPTED_PREFIX_V2)) {
    return decryptV2Payload(stored.slice(ENCRYPTED_PREFIX_V2.length), keyMaterial);
  }
  if (stored.startsWith(ENCRYPTED_PREFIX_V1)) {
    return decryptV1Payload(stored.slice(ENCRYPTED_PREFIX_V1.length), keyMaterial);
  }
  return stored;
}
