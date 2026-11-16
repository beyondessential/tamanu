import { beforeEach, describe, expect, it } from 'vitest';

import { ERROR_TYPE, InvalidCredentialError, RateLimitedError } from '@tamanu/errors';

import { SyncLoginBackoff, isLoginRefusal } from '../../app/sync/SyncLoginBackoff';

const SECOND = 1000;

// spec: CEND
describe('SyncLoginBackoff', () => {
  let now;
  let credentialKey;
  let backoff;

  beforeEach(() => {
    now = 1_000_000;
    credentialKey = 'sync@example.com:password';
    backoff = new SyncLoginBackoff({
      getSettings: async () => ({ initialDelayMs: 120 * SECOND, maxDelayMs: 3600 * SECOND }),
      now: () => now,
      getCredentialKey: () => credentialKey,
    });
  });

  const pausedFor = () => {
    try {
      backoff.check();
      return 0;
    } catch (error) {
      return error.extraData['retry-after'];
    }
  };

  it('is open until a refusal is recorded', () => {
    expect(backoff.isOpen()).toBe(true);
    expect(() => backoff.check()).not.toThrow();
  });

  it('pauses after a refusal, and says for how long in a rate-limited error', async () => {
    await backoff.recordRefusal();

    expect(backoff.isOpen()).toBe(false);
    expect(() => backoff.check()).toThrow(RateLimitedError);
    expect(pausedFor()).toBe(120);

    now += 45 * SECOND;
    expect(pausedFor()).toBe(75);
  });

  it('opens again once the pause has passed', async () => {
    await backoff.recordRefusal();
    now += 120 * SECOND;
    expect(backoff.isOpen()).toBe(true);
  });

  it('multiplies the pause by five for each refusal in a row, up to the maximum', async () => {
    const pauses = [];
    for (let i = 0; i < 6; i += 1) {
      await backoff.recordRefusal();
      pauses.push(pausedFor());
      now += pausedFor() * SECOND;
    }
    expect(pauses).toEqual([120, 600, 3000, 3600, 3600, 3600]);
  });

  it('passes the lockout window within two steps, whatever the number of endpoints', async () => {
    // central's default observation window is 10 minutes: no more than two rounds fit in it
    const roundTimes = [];
    for (let i = 0; i < 4; i += 1) {
      roundTimes.push(now);
      await backoff.recordRefusal();
      now += pausedFor() * SECOND;
    }
    const windowMs = 10 * 60 * SECOND;
    for (const start of roundTimes) {
      const inWindow = roundTimes.filter(time => time >= start && time < start + windowMs);
      expect(inWindow.length).toBeLessThanOrEqual(2);
    }
  });

  it('counts refusals that arrive while already paused as part of the same round', async () => {
    await backoff.recordRefusal();
    await backoff.recordRefusal();
    await backoff.recordRefusal();

    expect(pausedFor()).toBe(120);
    now += 120 * SECOND;
    await backoff.recordRefusal();
    expect(pausedFor()).toBe(600);
  });

  it('does not let concurrent refusals of one round lengthen the pause', async () => {
    await Promise.all([backoff.recordRefusal(), backoff.recordRefusal(), backoff.recordRefusal()]);
    expect(pausedFor()).toBe(120);
  });

  it('ends the pause and starts the schedule over after a successful login', async () => {
    await backoff.recordRefusal();
    now += 120 * SECOND;
    await backoff.recordRefusal();
    expect(pausedFor()).toBe(600);

    backoff.recordSuccess();
    expect(backoff.isOpen()).toBe(true);

    await backoff.recordRefusal();
    expect(pausedFor()).toBe(120);
  });

  it('forgets refusals of other credentials when the credentials change', async () => {
    await backoff.recordRefusal();
    expect(backoff.isOpen()).toBe(false);

    credentialKey = 'sync@example.com:new-password';

    expect(backoff.isOpen()).toBe(true);
    await backoff.recordRefusal();
    expect(pausedFor()).toBe(120);
  });

  it('reads the settings each time, so a change applies without a restart', async () => {
    let settings = { initialDelayMs: 10 * SECOND, maxDelayMs: 60 * SECOND };
    backoff = new SyncLoginBackoff({
      getSettings: async () => settings,
      now: () => now,
      getCredentialKey: () => credentialKey,
    });

    await backoff.recordRefusal();
    expect(pausedFor()).toBe(10);

    now += 10 * SECOND;
    settings = { initialDelayMs: 30 * SECOND, maxDelayMs: 40 * SECOND };
    await backoff.recordRefusal();
    expect(pausedFor()).toBe(40);
  });
});

describe('isLoginRefusal', () => {
  it('is true for refused credentials and for a lockout', () => {
    expect(isLoginRefusal(new InvalidCredentialError())).toBe(true);
    expect(isLoginRefusal(new RateLimitedError(60))).toBe(true);
  });

  it.each([
    ['an unreachable endpoint', { type: ERROR_TYPE.REMOTE_UNREACHABLE }],
    ['a server error', { type: ERROR_TYPE.REMOTE, status: 502 }],
    ['an incompatible client', { type: ERROR_TYPE.CLIENT_INCOMPATIBLE }],
    ['no error', undefined],
  ])('is false for %s', (_, error) => {
    expect(isLoginRefusal(error)).toBe(false);
  });
});
