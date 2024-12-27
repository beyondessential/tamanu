import { describe, test, expect } from 'vitest';
import {
  datetimeCustomValidation,
  endpointsOfDay,
  isIntervalWithinInterval,
  isWithinIntervalExcludingEnd,
  maxValidDate,
  minValidDate,
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
