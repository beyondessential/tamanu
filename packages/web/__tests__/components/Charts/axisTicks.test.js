import { describe, expect, it } from 'vitest';
import { getTime } from 'date-fns';

import {
  getXAxisTicks,
  isTimeShownOnXAxis,
} from '../../../app/components/Charts/helpers/axisTicks';

const timestampOf = dateString => getTime(new Date(dateString));

describe('getXAxisTicks', () => {
  it('generates a tick every 4 hours from the range start for a 24-hour range', () => {
    const ticks = getXAxisTicks(['2026-07-12 10:30:00', '2026-07-13 10:30:00']);

    expect(ticks).toEqual(
      [
        '2026-07-12 10:30:00',
        '2026-07-12 14:30:00',
        '2026-07-12 18:30:00',
        '2026-07-12 22:30:00',
        '2026-07-13 02:30:00',
        '2026-07-13 06:30:00',
        '2026-07-13 10:30:00',
      ].map(timestampOf),
    );
  });

  it('generates a tick every 4 hours from the range start for a 48-hour range', () => {
    const ticks = getXAxisTicks(['2026-07-11 10:30:00', '2026-07-13 10:30:00']);

    expect(ticks).toHaveLength(13);
    expect(ticks[0]).toBe(timestampOf('2026-07-11 10:30:00'));
    expect(ticks[12]).toBe(timestampOf('2026-07-13 10:30:00'));
  });

  it('generates a tick at the start of each day for a 7-day range', () => {
    const ticks = getXAxisTicks(['2026-07-06 10:30:00', '2026-07-13 10:30:00']);

    expect(ticks).toEqual(
      [
        '2026-07-07 00:00:00',
        '2026-07-08 00:00:00',
        '2026-07-09 00:00:00',
        '2026-07-10 00:00:00',
        '2026-07-11 00:00:00',
        '2026-07-12 00:00:00',
        '2026-07-13 00:00:00',
      ].map(timestampOf),
    );
  });

  it('keeps a tick on the range start when it is already a day boundary', () => {
    const ticks = getXAxisTicks(['2026-07-06 00:00:00', '2026-07-13 00:00:00']);

    expect(ticks).toEqual(
      [
        '2026-07-06 00:00:00',
        '2026-07-07 00:00:00',
        '2026-07-08 00:00:00',
        '2026-07-09 00:00:00',
        '2026-07-10 00:00:00',
        '2026-07-11 00:00:00',
        '2026-07-12 00:00:00',
        '2026-07-13 00:00:00',
      ].map(timestampOf),
    );
  });

  it('generates a day-boundary tick every 5 days for a 30-day range', () => {
    const ticks = getXAxisTicks(['2026-06-13 10:30:00', '2026-07-13 10:30:00']);

    expect(ticks).toEqual(
      [
        '2026-06-14 00:00:00',
        '2026-06-19 00:00:00',
        '2026-06-24 00:00:00',
        '2026-06-29 00:00:00',
        '2026-07-04 00:00:00',
        '2026-07-09 00:00:00',
      ].map(timestampOf),
    );
  });

  it('generates a tick at the start of each month for a 1-year range', () => {
    const ticks = getXAxisTicks(['2025-07-13 10:30:00', '2026-07-13 10:30:00']);

    expect(ticks).toEqual(
      [
        '2025-08-01 00:00:00',
        '2025-09-01 00:00:00',
        '2025-10-01 00:00:00',
        '2025-11-01 00:00:00',
        '2025-12-01 00:00:00',
        '2026-01-01 00:00:00',
        '2026-02-01 00:00:00',
        '2026-03-01 00:00:00',
        '2026-04-01 00:00:00',
        '2026-05-01 00:00:00',
        '2026-06-01 00:00:00',
        '2026-07-01 00:00:00',
      ].map(timestampOf),
    );
  });

  it('keeps monthly ticks on month boundaries through shorter months', () => {
    const ticks = getXAxisTicks(['2025-01-31 10:30:00', '2026-01-31 10:30:00']);

    expect(ticks).toEqual(
      [
        '2025-02-01 00:00:00',
        '2025-03-01 00:00:00',
        '2025-04-01 00:00:00',
        '2025-05-01 00:00:00',
        '2025-06-01 00:00:00',
        '2025-07-01 00:00:00',
        '2025-08-01 00:00:00',
        '2025-09-01 00:00:00',
        '2025-10-01 00:00:00',
        '2025-11-01 00:00:00',
        '2025-12-01 00:00:00',
        '2026-01-01 00:00:00',
      ].map(timestampOf),
    );
  });
});

describe('isTimeShownOnXAxis', () => {
  it.each([
    ['24-hour', ['2026-07-12 10:30:00', '2026-07-13 10:30:00'], true],
    ['48-hour', ['2026-07-11 10:30:00', '2026-07-13 10:30:00'], true],
    ['custom single day', ['2026-07-13 00:00:00', '2026-07-14 00:00:00'], true],
    ['7-day', ['2026-07-06 10:30:00', '2026-07-13 10:30:00'], false],
    ['30-day', ['2026-06-13 10:30:00', '2026-07-13 10:30:00'], false],
    ['1-year', ['2025-07-13 10:30:00', '2026-07-13 10:30:00'], false],
  ])('returns %s range as %s', (_label, dateRange, expected) => {
    expect(isTimeShownOnXAxis(dateRange)).toBe(expected);
  });
});
