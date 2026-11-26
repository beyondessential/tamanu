import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  TamanuApi as ApiClient,
  readPersistedAuthToken,
  route,
  writePersistedAuthToken,
} from '@tamanu/api-client';
import { ERROR_TYPE } from '@tamanu/errors';
import { TamanuApi } from '../../app/api/TamanuApi';
import { LOCAL_STORAGE_KEYS } from '../../app/constants';

const { notifyError } = vi.hoisted(() => ({
  notifyError: vi.fn(),
}));

vi.mock('../../app/utils', () => ({
  getDeviceId: () => 'test-device',
  notifyError,
}));

describe('TamanuApi error toast relegation', () => {
  let api;
  let fetchSpy;
  let systemErrorHandler;

  beforeEach(() => {
    window.history.pushState({}, '', '/patient/123');
    api = new TamanuApi('test-version');
    systemErrorHandler = vi.fn();
    api.setSystemErrorHandler(systemErrorHandler);
    fetchSpy = vi.spyOn(ApiClient.prototype, 'fetch');
    notifyError.mockClear();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  const rejectWith = error => fetchSpy.mockRejectedValue(error);

  it('relegates a server-kind error on the clinical client instead of toasting', async () => {
    rejectWith({ type: ERROR_TYPE.DATABASE, title: 'boom' });

    await expect(
      api.get('patient/123', {}, { showUnknownErrorToast: true }),
    ).rejects.toBeTruthy();

    expect(systemErrorHandler).toHaveBeenCalledTimes(1);
    expect(systemErrorHandler).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'patient/123: boom' }),
    );
    expect(notifyError).not.toHaveBeenCalled();
  });

  it('still toasts a server-kind error on the admin panel', async () => {
    window.history.pushState({}, '', '/admin/settings');
    rejectWith({ type: ERROR_TYPE.DATABASE, title: 'boom' });

    await expect(
      api.get('admin/settings', {}, { showUnknownErrorToast: true }),
    ).rejects.toBeTruthy();

    expect(notifyError).toHaveBeenCalledTimes(1);
    expect(systemErrorHandler).not.toHaveBeenCalled();
  });

  it('records the resolved path of a route() endpoint in a system error', async () => {
    rejectWith({ type: ERROR_TYPE.DATABASE, title: 'boom' });

    await expect(
      api.get(route('patient/:patientId', { patientId: '123' }), {}, { showUnknownErrorToast: true }),
    ).rejects.toBeTruthy();

    expect(systemErrorHandler).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'patient/123: boom' }),
    );
  });

  it('shows the resolved path of a route() endpoint in an admin panel toast', async () => {
    window.history.pushState({}, '', '/admin/roles');
    rejectWith({ type: ERROR_TYPE.DATABASE, title: 'boom' });

    await expect(
      api.get(route('admin/role/:roleId', { roleId: 'abc' }), {}, { showUnknownErrorToast: true }),
    ).rejects.toBeTruthy();

    const [toastContent] = notifyError.mock.calls[0];
    expect(toastContent).toContainEqual(
      expect.objectContaining({
        props: expect.objectContaining({ replacements: { path: 'admin/role/abc' } }),
      }),
    );
  });

  it('relegates a server-kind error on facility admin, since it is part of the regular clinical client', async () => {
    window.history.pushState({}, '', '/facility-admin/system-errors');
    rejectWith({ type: ERROR_TYPE.DATABASE, title: 'boom' });

    await expect(
      api.get('facility-admin/system-errors', {}, { showUnknownErrorToast: true }),
    ).rejects.toBeTruthy();

    expect(systemErrorHandler).toHaveBeenCalledTimes(1);
    expect(notifyError).not.toHaveBeenCalled();
  });

  it('still toasts an unreachable error on the clinical client', async () => {
    rejectWith({ type: ERROR_TYPE.REMOTE_UNREACHABLE, title: 'Failed to fetch' });

    await expect(
      api.get('patient/123', {}, { showUnknownErrorToast: true }),
    ).rejects.toBeTruthy();

    expect(notifyError).toHaveBeenCalledTimes(1);
    expect(systemErrorHandler).not.toHaveBeenCalled();
  });

  it('still toasts an edit-conflict error on the clinical client', async () => {
    rejectWith({ type: ERROR_TYPE.EDIT_CONFLICT, title: 'conflict' });

    await expect(
      api.get('patient/123', {}, { showUnknownErrorToast: true }),
    ).rejects.toBeTruthy();

    expect(notifyError).toHaveBeenCalledTimes(1);
    expect(systemErrorHandler).not.toHaveBeenCalled();
  });

  it('does nothing when showUnknownErrorToast is false', async () => {
    rejectWith({ type: ERROR_TYPE.DATABASE, title: 'boom' });

    await expect(
      api.get('patient/123', {}, { showUnknownErrorToast: false }),
    ).rejects.toBeTruthy();

    expect(notifyError).not.toHaveBeenCalled();
    expect(systemErrorHandler).not.toHaveBeenCalled();
  });
});

describe('TamanuApi token renewal', () => {
  let api;
  let fetchSpy;

  const readStoredToken = async () =>
    (await readPersistedAuthToken(LOCAL_STORAGE_KEYS.TOKEN, 'test-device', 'webapp')).token;

  beforeEach(async () => {
    // Node's own localStorage global shadows jsdom's, and is undefined without a storage file
    const items = new Map();
    vi.stubGlobal('localStorage', {
      getItem: key => items.get(key) ?? null,
      setItem: (key, value) => items.set(key, value),
      removeItem: key => items.delete(key),
    });
    api = new TamanuApi('test-version');
    await api.setToken('first');
    fetchSpy = vi.spyOn(ApiClient.prototype, 'fetch').mockResolvedValue({ token: 'second' });
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it('stores the renewed token', async () => {
    await api.refreshToken();

    expect(api.getToken()).toBe('second');
    expect(await readStoredToken()).toBe('second');
  });

  it('does not restore a sign-in logged out in another tab', async () => {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN);

    await api.refreshToken();

    expect(api.getToken()).toBe('second');
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN)).toBeNull();
  });

  it('does not replace a sign-in made in another tab', async () => {
    await writePersistedAuthToken(LOCAL_STORAGE_KEYS.TOKEN, 'other user', 'test-device', 'webapp');

    await api.refreshToken();

    expect(api.getToken()).toBe('second');
    expect(await readStoredToken()).toBe('other user');
  });
});
