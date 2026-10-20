import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { TamanuApi as ApiClient } from '@tamanu/api-client';
import { ERROR_TYPE } from '@tamanu/errors';
import { TamanuApi } from '../../app/api/TamanuApi';

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
