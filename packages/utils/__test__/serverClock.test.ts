import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  resetServerClock,
  serverNowMs,
  updateServerClockFromDateHeader,
} from '../src/serverClock';
import {
  getCurrentDateStringInTimezone,
  getCurrentDateTimeStringInTimezone,
  getFacilityNowDate,
} from '../src/dateTime';

afterEach(() => {
  resetServerClock();
  vi.useRealTimers();
});

describe('serverClock', () => {
  test('no header seen: serverNowMs matches the local clock', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-03T00:00:00Z'));
    expect(serverNowMs()).toBe(Date.parse('2026-09-03T00:00:00Z'));
  });

  test('applies the offset from a Date header', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-03T11:00:00Z'));
    updateServerClockFromDateHeader('Thu, 03 Sep 2026 00:00:00 GMT');
    expect(serverNowMs()).toBe(Date.parse('2026-09-03T00:00:00Z'));
  });

  test('ignores missing or unparseable headers', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-03T11:00:00Z'));
    updateServerClockFromDateHeader('Thu, 03 Sep 2026 00:00:00 GMT');
    updateServerClockFromDateHeader(null);
    updateServerClockFromDateHeader('nonsense');
    expect(serverNowMs()).toBe(Date.parse('2026-09-03T00:00:00Z'));
  });
});

describe('current-time utils with an explicit instant', () => {
  const nowMs = Date.parse('2026-08-28T18:13:00Z');

  test('getCurrentDateTimeStringInTimezone', () => {
    expect(getCurrentDateTimeStringInTimezone('Pacific/Nauru', nowMs)).toBe('2026-08-29 06:13:00');
    expect(getCurrentDateTimeStringInTimezone('UTC', nowMs)).toBe('2026-08-28 18:13:00');
  });

  test('getCurrentDateStringInTimezone', () => {
    expect(getCurrentDateStringInTimezone('Pacific/Nauru', nowMs)).toBe('2026-08-29');
    expect(getCurrentDateStringInTimezone('UTC', nowMs)).toBe('2026-08-28');
  });

  test('getFacilityNowDate', () => {
    const date = getFacilityNowDate('UTC', 'Pacific/Nauru', nowMs);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(7);
    expect(date.getDate()).toBe(29);
    expect(date.getHours()).toBe(6);
    expect(date.getMinutes()).toBe(13);
  });
});
