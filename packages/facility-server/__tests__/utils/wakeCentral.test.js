import { beforeEach, describe, expect, it, vi } from 'vitest';

import { wakeCentral } from '../../app/utils/wakeCentral';
import { CentralServerConnection } from '../../app/sync/CentralServerConnection';

vi.mock('../../app/sync/CentralServerConnection', () => ({
  CentralServerConnection: vi.fn(),
}));

describe('wakeCentral', () => {
  const fetch = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    CentralServerConnection.mockImplementation(function () {
      this.fetch = fetch;
    });
  });

  it('makes one attempt at an ordinary request to central, login included', async () => {
    fetch.mockResolvedValue({});

    await wakeCentral('device-1');

    expect(CentralServerConnection).toHaveBeenCalledWith({ deviceId: 'device-1' });
    expect(fetch).toHaveBeenCalledExactlyOnceWith('whoami', {
      backoff: false,
      preserveBackoffForAuthAttempt: true,
    });
  });

  it('swallows a failed request, as socket.io buffers the message', async () => {
    fetch.mockRejectedValue(new Error('central is down'));

    await expect(wakeCentral('device-1')).resolves.toBeUndefined();
  });

  it('swallows a failure to build the connection', async () => {
    CentralServerConnection.mockImplementation(function () {
      throw new Error('Facility server has no sync host configured');
    });

    await expect(wakeCentral('device-1')).resolves.toBeUndefined();
  });
});
