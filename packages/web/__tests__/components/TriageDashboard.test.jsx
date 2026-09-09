import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { getAverageWaitTime } from '../../app/components/TriageDashboard';

const storedDateTimeToEpochMilliseconds = value => (value ? new Date(value).getTime() : null);

describe('getAverageWaitTime', () => {
  const NOW = new Date('2026-08-04T12:00:00.000Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('measures from arrivalTime, not triageTime, when arrivalTime is set', () => {
    const categoryData = [
      {
        arrivalTime: '2026-08-04T00:00:00.000Z', // 12 hours before now
        triageTime: '2026-08-04T11:53:00.000Z', // 7 minutes before now
      },
    ];
    expect(getAverageWaitTime(categoryData, storedDateTimeToEpochMilliseconds)).toBe(
      12 * 60 * 60 * 1000,
    );
  });

  it('falls back to triageTime when arrivalTime is not set', () => {
    const categoryData = [{ arrivalTime: null, triageTime: '2026-08-04T11:53:00.000Z' }];
    expect(getAverageWaitTime(categoryData, storedDateTimeToEpochMilliseconds)).toBe(7 * 60 * 1000);
  });

  it("averages across multiple patients, using each one's own arrival/triage fallback", () => {
    const categoryData = [
      { arrivalTime: '2026-08-04T10:00:00.000Z', triageTime: '2026-08-04T11:00:00.000Z' }, // 2hrs wait
      { arrivalTime: null, triageTime: '2026-08-04T11:00:00.000Z' }, // 1hr wait (falls back)
    ];
    expect(getAverageWaitTime(categoryData, storedDateTimeToEpochMilliseconds)).toBe(
      1.5 * 60 * 60 * 1000,
    );
  });

  it('returns 0 for an empty category', () => {
    expect(getAverageWaitTime([], storedDateTimeToEpochMilliseconds)).toBe(0);
  });
});
