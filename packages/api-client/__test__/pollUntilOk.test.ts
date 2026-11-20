import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ERROR_TYPE, Problem } from '@tamanu/errors';

import { TamanuApi } from '../src/TamanuApi';

const problemWithStatus = (status: number) =>
  new Problem(ERROR_TYPE.REMOTE, 'Server error', status, 'Invalid JSON in response');

describe('pollUntilOk', () => {
  let api: TamanuApi;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    api = new TamanuApi({
      endpoint: 'http://central.test/api',
      agentName: 'test',
      agentVersion: '0.0.0',
      deviceId: 'test-device',
      logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() } as any,
    });
    fetchSpy = vi.spyOn(api, 'fetch');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps polling through gateway errors until the endpoint is ready', async () => {
    fetchSpy
      .mockResolvedValueOnce(false)
      .mockRejectedValueOnce(problemWithStatus(502))
      .mockRejectedValueOnce(problemWithStatus(503))
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    const result = api.pollUntilOk('sync/session/pull/ready');
    await vi.runAllTimersAsync();

    await expect(result).resolves.toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(5);
  });

  it('throws other errors straight away', async () => {
    const notFound = problemWithStatus(404);
    fetchSpy.mockResolvedValueOnce(false).mockRejectedValueOnce(notFound);

    const result = api.pollUntilOk('sync/session/pull/ready');
    const assertion = expect(result).rejects.toBe(notFound);
    await vi.runAllTimersAsync();

    await assertion;
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('gives up after five minutes of consecutive gateway errors', async () => {
    const badGateway = problemWithStatus(502);
    fetchSpy.mockRejectedValue(badGateway);

    const result = api.pollUntilOk('sync/session/pull/ready');
    const assertion = expect(result).rejects.toBe(badGateway);
    await vi.runAllTimersAsync();

    await assertion;
    expect(fetchSpy).toHaveBeenCalledTimes(60 * 5 + 1);
  });
});
