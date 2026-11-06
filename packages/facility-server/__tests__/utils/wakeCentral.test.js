import config from 'config';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { wakeCentral } from '../../app/utils/wakeCentral';
import { CentralServerConnection } from '../../app/sync/CentralServerConnection';

vi.mock('../../app/sync/CentralServerConnection', () => ({
  CentralServerConnection: vi.fn(),
}));

describe('wakeCentral', () => {
  const fetch = vi.fn();
  const connect = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    CentralServerConnection.mockImplementation(function () {
      this.fetch = fetch;
      this.connect = connect;
    });
  });

  it('makes one bounded attempt at the login and at the request that wakes central', async () => {
    fetch.mockResolvedValue({});

    await wakeCentral('device-1');

    expect(CentralServerConnection).toHaveBeenCalledWith({ deviceId: 'device-1' });
    expect(connect).toHaveBeenCalledExactlyOnceWith(false, config.sync.timeout);
    expect(fetch).toHaveBeenCalledExactlyOnceWith('whoami', {
      backoff: false,
      retryAuth: false,
    });
  });

  it('swallows a failed request, as socket.io buffers the message', async () => {
    fetch.mockRejectedValue(new Error('central is down'));

    await expect(wakeCentral('device-1')).resolves.toBeUndefined();
  });

  it('swallows a failed login', async () => {
    connect.mockRejectedValue(new Error('central is down'));

    await expect(wakeCentral('device-1')).resolves.toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('swallows a failure to build the connection', async () => {
    CentralServerConnection.mockImplementation(function () {
      throw new Error('Facility server has no sync host configured');
    });

    await expect(wakeCentral('device-1')).resolves.toBeUndefined();
  });
});
