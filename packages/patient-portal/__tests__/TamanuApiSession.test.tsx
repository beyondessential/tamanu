import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TamanuApi } from '@api/TamanuApi';

const patient = { id: 'patient-1', email: 'patient@example.com', displayName: 'Pat' };

const signedInApi = async () => {
  const api = new TamanuApi('0.0.0');
  await api.setToken('token-a');
  api.setUser(patient);
  return api;
};

describe('portal TamanuApi signed-in patient', () => {
  // Node's own localStorage shadows jsdom's and is undefined without a backing file. Tabs share
  // the saved session through it, so each test gets a fresh in-memory one.
  beforeEach(() => {
    const items = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => items.set(key, String(value)),
      removeItem: (key: string) => items.delete(key),
    });
  });

  it('clears the patient and sign-in on logout', async () => {
    const api = await signedInApi();
    expect(api.signInId).not.toBeNull();

    await api.logout();

    expect(api.user).toBeNull();
    expect(api.signInId).toBeNull();
  });

  it('clears the patient when another tab signs in with a different session', async () => {
    const api = await signedInApi();
    await new TamanuApi('0.0.0').setToken('token-b');

    await api.syncSession();

    expect(api.user).toBeNull();
    expect(api.signInId).toBeNull();
  });

  it('keeps the patient when the session token is unchanged', async () => {
    const api = await signedInApi();
    const { signInId } = api;

    await api.syncSession();

    expect(api.user).toBe(patient);
    expect(api.signInId).toBe(signInId);
  });
});
