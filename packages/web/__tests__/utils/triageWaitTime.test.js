import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  MINUTE,
  HOUR,
  getElapsedMillisecondsSince,
  getTriageStartTime,
  getTriageWaitTime,
  splitDurationHoursMinutes,
} from '../../app/utils/triageWaitTime';

const storedDateTimeToEpochMilliseconds = value => (value ? new Date(value).getTime() : null);

describe('getTriageStartTime', () => {
  it('prefers arrivalTime when both arrivalTime and triageTime are set', () => {
    expect(
      getTriageStartTime({ arrivalTime: '2026-08-04T00:00:00.000Z', triageTime: '2026-08-04T11:00:00.000Z' }),
    ).toBe('2026-08-04T00:00:00.000Z');
  });

  it('falls back to triageTime when arrivalTime is not set', () => {
    expect(
      getTriageStartTime({ arrivalTime: null, triageTime: '2026-08-04T11:00:00.000Z' }),
    ).toBe('2026-08-04T11:00:00.000Z');
  });
});

describe('getElapsedMillisecondsSince', () => {
  const NOW = new Date('2026-08-04T12:00:00.000Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the milliseconds elapsed since the given stored datetime', () => {
    expect(
      getElapsedMillisecondsSince('2026-08-04T11:53:00.000Z', storedDateTimeToEpochMilliseconds),
    ).toBe(7 * MINUTE);
  });

  it('returns null when the stored datetime cannot be parsed', () => {
    expect(getElapsedMillisecondsSince(null, storedDateTimeToEpochMilliseconds)).toBeNull();
  });
});

describe('getTriageWaitTime', () => {
  const NOW = new Date('2026-08-04T12:00:00.000Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('measures from arrivalTime, not triageTime, when arrivalTime is set', () => {
    const triage = {
      arrivalTime: '2026-08-04T00:00:00.000Z', // 12 hours before now
      triageTime: '2026-08-04T11:53:00.000Z', // 7 minutes before now
    };
    expect(getTriageWaitTime(triage, storedDateTimeToEpochMilliseconds)).toBe(12 * HOUR);
  });

  it('falls back to triageTime when arrivalTime is not set', () => {
    const triage = { arrivalTime: null, triageTime: '2026-08-04T11:53:00.000Z' };
    expect(getTriageWaitTime(triage, storedDateTimeToEpochMilliseconds)).toBe(7 * MINUTE);
  });
});

describe('splitDurationHoursMinutes', () => {
  it('splits a duration into whole hours and remaining minutes', () => {
    expect(splitDurationHoursMinutes(12 * HOUR + 8 * MINUTE)).toEqual({ hours: 12, minutes: 8 });
  });

  it('rounds down partial minutes', () => {
    expect(splitDurationHoursMinutes(7 * MINUTE + 30 * 1000)).toEqual({ hours: 0, minutes: 7 });
  });
});
