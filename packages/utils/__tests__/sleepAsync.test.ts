import { sleepAsync } from '../src/sleepAsync';
import { describe, expect, it, vitest } from 'vitest';

describe('sleepAsync', () => {
  vitest.useFakeTimers();

  it('should resolve after the specified time', async () => {
    const ms = 1000;
    const promise = sleepAsync(ms);

    vitest.advanceTimersByTime(ms);

    await expect(promise).resolves.toBeUndefined();
  });

  it('should not resolve before the specified time', async () => {
    const ms = 1000;
    const promise = sleepAsync(ms);

    vitest.advanceTimersByTime(ms - 1);

    let resolved = false;
    promise.then(() => {
      resolved = true;
    });

    expect(resolved).toBe(false);
  });
});
