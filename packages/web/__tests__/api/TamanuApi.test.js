import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { TamanuApi as ApiClient } from '@tamanu/api-client';
import { ERROR_TYPE } from '@tamanu/errors';

const { notifyError, relegateSystemError } = vi.hoisted(() => ({
  notifyError: vi.fn(),
  relegateSystemError: vi.fn(),
}));

vi.mock('../../app/utils', () => ({
  getDeviceId: () => 'test-device',
  notifyError,
}));

vi.mock('../../app/api/relegateSystemError', () => ({ relegateSystemError }));

// eslint-disable-next-line import/first
import { TamanuApi } from '../../app/api/TamanuApi';

describe('TamanuApi error toast relegation', () => {
  let api;
  let fetchSpy;

  beforeEach(() => {
    window.history.pushState({}, '', '/patient/123');
    api = new TamanuApi('test-version');
    fetchSpy = vi.spyOn(ApiClient.prototype, 'fetch');
    notifyError.mockClear();
    relegateSystemError.mockClear();
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

    expect(relegateSystemError).toHaveBeenCalledTimes(1);
    expect(relegateSystemError).toHaveBeenCalledWith(
      expect.objectContaining({ type: ERROR_TYPE.DATABASE }),
      'patient/123',
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
    expect(relegateSystemError).not.toHaveBeenCalled();
  });

  it('relegates a server-kind error on facility admin, since it is part of the regular clinical client', async () => {
    window.history.pushState({}, '', '/facility-admin/system-errors');
    rejectWith({ type: ERROR_TYPE.DATABASE, title: 'boom' });

    await expect(
      api.get('facility-admin/system-errors', {}, { showUnknownErrorToast: true }),
    ).rejects.toBeTruthy();

    expect(relegateSystemError).toHaveBeenCalledTimes(1);
    expect(notifyError).not.toHaveBeenCalled();
  });

  it('still toasts an unreachable error on the clinical client', async () => {
    rejectWith({ type: ERROR_TYPE.REMOTE_UNREACHABLE, title: 'Failed to fetch' });

    await expect(
      api.get('patient/123', {}, { showUnknownErrorToast: true }),
    ).rejects.toBeTruthy();

    expect(notifyError).toHaveBeenCalledTimes(1);
    expect(relegateSystemError).not.toHaveBeenCalled();
  });

  it('still toasts an edit-conflict error on the clinical client', async () => {
    rejectWith({ type: ERROR_TYPE.EDIT_CONFLICT, title: 'conflict' });

    await expect(
      api.get('patient/123', {}, { showUnknownErrorToast: true }),
    ).rejects.toBeTruthy();

    expect(notifyError).toHaveBeenCalledTimes(1);
    expect(relegateSystemError).not.toHaveBeenCalled();
  });

  it('does nothing when showUnknownErrorToast is false', async () => {
    rejectWith({ type: ERROR_TYPE.DATABASE, title: 'boom' });

    await expect(
      api.get('patient/123', {}, { showUnknownErrorToast: false }),
    ).rejects.toBeTruthy();

    expect(notifyError).not.toHaveBeenCalled();
    expect(relegateSystemError).not.toHaveBeenCalled();
  });
});
