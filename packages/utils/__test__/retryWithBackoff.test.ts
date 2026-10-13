import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { retryWithBackoff } from '../src/retryWithBackoff';

describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns immediately when the first attempt succeeds', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    await expect(retryWithBackoff(fn, { maxElapsedMs: 1000 })).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries until the function succeeds', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('down'))
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValue('ok');
    const onRetry = vi.fn();

    const promise = retryWithBackoff(fn, { maxElapsedMs: 60_000, onRetry });
    await vi.runAllTimersAsync();

    await expect(promise).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenCalledTimes(2);
  });

  it('backs off exponentially up to the maximum delay', async () => {
    const delays: number[] = [];
    const fn = vi.fn().mockRejectedValue(new Error('down'));

    const promise = retryWithBackoff(fn, {
      maxElapsedMs: Infinity,
      initialDelayMs: 100,
      maxDelayMs: 400,
      onRetry: ({ nextDelayMs, attempt }) => {
        delays.push(nextDelayMs);
        if (attempt === 5) throw new Error('stop');
      },
    });
    promise.catch(() => {});
    await vi.runAllTimersAsync();

    await expect(promise).rejects.toThrow('stop');
    // each delay is jittered into [50%, 100%] of 100, 200, 400, 400, 400
    [100, 200, 400, 400, 400].forEach((base, i) => {
      expect(delays[i]).toBeGreaterThanOrEqual(base / 2);
      expect(delays[i]).toBeLessThanOrEqual(base);
    });
  });

  it('throws the latest error once the elapsed budget is spent', async () => {
    const fn = vi.fn().mockImplementation(() => Promise.reject(new Error('still down')));

    const promise = retryWithBackoff(fn, { maxElapsedMs: 5_000, initialDelayMs: 1000 });
    promise.catch(() => {});
    await vi.runAllTimersAsync();

    await expect(promise).rejects.toThrow('still down');
    expect(fn.mock.calls.length).toBeGreaterThan(1);
  });

  it('throws immediately for errors that are not retryable', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('bad password'));

    await expect(
      retryWithBackoff(fn, { maxElapsedMs: 60_000, isRetryable: () => false }),
    ).rejects.toThrow('bad password');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('stops waiting when the signal aborts', async () => {
    const controller = new AbortController();
    const fn = vi.fn().mockRejectedValue(new Error('down'));

    const promise = retryWithBackoff(fn, {
      maxElapsedMs: 60_000,
      signal: controller.signal,
      onRetry: () => controller.abort(),
    });
    promise.catch(() => {});
    await vi.runAllTimersAsync();

    await expect(promise).rejects.toThrow('down');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not wait out the delay when aborted before the wait begins', async () => {
    const controller = new AbortController();
    const fn = vi.fn().mockRejectedValue(new Error('down'));

    const promise = retryWithBackoff(fn, {
      maxElapsedMs: 60_000,
      initialDelayMs: 10_000,
      signal: controller.signal,
      onRetry: () => controller.abort(),
    });
    promise.catch(() => {});
    // no timers advanced: the rejection must not depend on the backoff delay elapsing
    await vi.advanceTimersByTimeAsync(0);

    await expect(promise).rejects.toThrow('down');
  });
});

