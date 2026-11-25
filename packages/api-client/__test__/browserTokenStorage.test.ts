import { describe, expect, it } from 'vitest';
import {
  readPersistedAuthToken,
  renewPersistedAuthToken,
  writePersistedAuthToken,
  type AuthTokenStorage,
} from '../src/browserTokenStorage';

const KEY = 'apiToken';
const DEVICE_ID = 'device-1';
const ORIGIN = 'https://facility.example';

const createStorage = (): AuthTokenStorage => {
  const items = new Map<string, string>();
  return {
    getItem: key => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, value),
    removeItem: key => items.delete(key),
  };
};

const write = (storage: AuthTokenStorage, token: string) =>
  writePersistedAuthToken(KEY, token, DEVICE_ID, 'webapp', storage, ORIGIN);

const read = async (storage: AuthTokenStorage) =>
  (await readPersistedAuthToken(KEY, DEVICE_ID, 'webapp', storage, ORIGIN)).token;

const renew = (storage: AuthTokenStorage, currentToken: string, renewedToken: string) =>
  renewPersistedAuthToken(KEY, currentToken, renewedToken, DEVICE_ID, 'webapp', storage, ORIGIN);

describe('renewPersistedAuthToken', () => {
  it('replaces the stored token while it is still the current one', async () => {
    const storage = createStorage();
    await write(storage, 'first');

    expect(await renew(storage, 'first', 'second')).toBe(true);
    expect(await read(storage)).toBe('second');
  });

  it('does not restore a token logged out in another tab', async () => {
    const storage = createStorage();
    await write(storage, 'first');
    storage.removeItem(KEY);

    expect(await renew(storage, 'first', 'second')).toBe(false);
    expect(storage.getItem(KEY)).toBeNull();
  });

  it('does not replace a sign-in made in another tab', async () => {
    const storage = createStorage();
    await write(storage, 'other user');

    expect(await renew(storage, 'first', 'second')).toBe(false);
    expect(await read(storage)).toBe('other user');
  });

  it('keeps a logout made while the renewed token is being encrypted', async () => {
    const storage = createStorage();
    await write(storage, 'first');

    const renewal = renew(storage, 'first', 'second');
    storage.removeItem(KEY);

    expect(await renewal).toBe(false);
    expect(storage.getItem(KEY)).toBeNull();
  });
});
