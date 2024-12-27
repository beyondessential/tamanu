import { describe, test, expect } from 'vitest';
import {
  datetimeCustomValidation,
  doAgeRangesHaveGaps,
  doAgeRangesOverlap,
  endpointsOfDay,
  isIntervalWithinInterval,
  isWithinIntervalExcludingEnd,
  maxValidDate,
  minValidDate,
  type AgeRange,
} from '../src/dateTime';
import { startOfDay, endOfDay } from 'date-fns';

describe('dateTime utilities', () => {
  test('datetimeCustomValidation', () => {
    const validDate = '2023-10-10 12:00:00';
    const invalidDate = '2023-10-10T12:00:00Z';
    const invalidFormat = '2023/10/10 12:00:00';

    expect(datetimeCustomValidation.safeParse(validDate).success).toBe(true);
    expect(datetimeCustomValidation.safeParse(invalidDate).success).toBe(false);
    expect(datetimeCustomValidation.safeParse(invalidFormat).success).toBe(false);
  });

  test('endpointsOfDay', () => {
    const date = new Date('2023-10-10T12:00:00');
    const [start, end] = endpointsOfDay(date);

    expect(start).toEqual(startOfDay(date));
    expect(end).toEqual(endOfDay(date));
  });

  test('isIntervalWithinInterval', () => {
    const interval1 = {
      start: new Date('2023-10-10T12:00:00'),
      end: new Date('2023-10-11T12:00:00'),
    };
    const interval2 = {
      start: new Date('2023-10-09T12:00:00'),
      end: new Date('2023-10-12T12:00:00'),
    };

    expect(isIntervalWithinInterval(interval1, interval2)).toBe(true);
    expect(isIntervalWithinInterval(interval2, interval1)).toBe(false);
  });

  test('isWithinIntervalExcludingEnd', () => {
    const date = new Date('2023-10-10T12:00:00');
    const interval = {
      start: new Date('2023-10-10T00:00:00'),
      end: new Date('2023-10-11T00:00:00'),
    };

    expect(isWithinIntervalExcludingEnd(date, interval)).toBe(true);
    expect(isWithinIntervalExcludingEnd(new Date('2023-10-11T00:00:00'), interval)).toBe(false);
  });

  test('maxValidDate', () => {
    const dates = [new Date('2023-10-10'), new Date('2023-10-11'), new Date('2023-10-09')];
    const invalidDates = [new Date('invalid date'), new Date('invalid date')];

    expect(maxValidDate(dates)).toEqual(new Date('2023-10-11'));
    expect(maxValidDate(invalidDates)).toBeNull();
  });

  test('minValidDate', () => {
    const dates = [new Date('2023-10-10'), new Date('2023-10-11'), new Date('2023-10-09')];
    const invalidDates = [new Date('invalid date'), new Date('invalid date')];

    expect(minValidDate(dates)).toEqual(new Date('2023-10-09'));
    expect(minValidDate(invalidDates)).toBeNull();
  });
});

describe('doAgeRangesHaveGaps', () => {
  it('should return true for ranges with gaps', () => {
    // Gap between [0-10)-[11-20)
    const ranges: AgeRange[] = [
      { ageMin: 0, ageMax: 10, ageUnit: 'years' },
      { ageMin: 11, ageMax: 20, ageUnit: 'years' },
      { ageMin: 21, ageMax: 30, ageUnit: 'years' },
    ];
    expect(doAgeRangesHaveGaps(ranges)).toBe(true);
  });

  it('should return false for ranges without gaps', () => {
    const ranges: AgeRange[] = [
      { ageMin: 0, ageMax: 120, ageUnit: 'minutes' },
      { ageMin: 2, ageMax: 24, ageUnit: 'hours' },
      { ageMin: 1, ageMax: 14, ageUnit: 'days' },
      { ageMin: 2, ageMax: 8, ageUnit: 'weeks' },
      { ageMin: 2, ageMax: 24, ageUnit: 'months' },
      { ageMin: 2, ageMax: 10, ageUnit: 'years' },
      { ageMin: 10, ageMax: 20, ageUnit: 'years' },
      { ageMin: 20, ageMax: 30, ageUnit: 'years' },
    ];
    expect(doAgeRangesHaveGaps(ranges)).toBe(false);
  });

  it('should return false for empty ranges', () => {
    const ranges = [];
    expect(doAgeRangesHaveGaps(ranges)).toBe(false);
  });

  it('should return false for single range', () => {
    const ranges: AgeRange[] = [{ ageMin: 0, ageMax: 10, ageUnit: 'years' }];
    expect(doAgeRangesHaveGaps(ranges)).toBe(false);
  });
});

describe('doAgeRangesOverlap', () => {
  it('should return true if ranges overlap', () => {
    const ranges: AgeRange[] = [
      { ageMin: 20, ageMax: 30, ageUnit: 'years' },
      { ageMin: 25, ageMax: 35, ageUnit: 'years' },
      { ageMin: 35, ageMax: 40, ageUnit: 'years' },
    ];
    expect(doAgeRangesOverlap(ranges)).toBe(true);
  });

  it('should return true if ranges match', () => {
    const ranges: AgeRange[] = [
      { ageMin: 20, ageMax: 30, ageUnit: 'years' },
      { ageMin: 20, ageMax: 30, ageUnit: 'years' },
      { ageMin: 30, ageMax: 40, ageUnit: 'years' },
    ];
    expect(doAgeRangesOverlap(ranges)).toBe(true);
  });

  it('should return false if ranges do not overlap', () => {
    const ranges: AgeRange[] = [
      { ageMin: 20, ageMax: 30, ageUnit: 'years' },
      { ageMin: 30, ageMax: 35, ageUnit: 'years' },
      { ageMin: 35, ageMax: 40, ageUnit: 'years' },
    ];
    expect(doAgeRangesOverlap(ranges)).toBe(false);
  });
});
