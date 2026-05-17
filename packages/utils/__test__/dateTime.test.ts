import { describe, test, expect, it } from 'vitest';
import {
  datetimeCustomValidation,
  doAgeRangesHaveGaps,
  doAgeRangesOverlap,
  endpointsOfDay,
  formatSurveyTimeFromDate,
  isIntervalWithinInterval,
  isValidSurveyTimeBody,
  isWithinIntervalExcludingEnd,
  maxValidDate,
  minValidDate,
  parseSurveyTimeToHms,
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

describe('survey program Time (HH:mm:ss body)', () => {
  describe('parseSurveyTimeToHms', () => {
    it('returns null for empty', () => {
      expect(parseSurveyTimeToHms(null)).toBeNull();
      expect(parseSurveyTimeToHms(undefined)).toBeNull();
      expect(parseSurveyTimeToHms('')).toBeNull();
      expect(parseSurveyTimeToHms('   ')).toBeNull();
    });

    it('accepts canonical HH:mm:ss', () => {
      expect(parseSurveyTimeToHms('00:00:00')).toBe('00:00:00');
      expect(parseSurveyTimeToHms('23:59:59')).toBe('23:59:59');
      expect(parseSurveyTimeToHms(' 09:30:01 ')).toBe('09:30:01');
    });

    it('pads HH:mm to HH:mm:00', () => {
      expect(parseSurveyTimeToHms('09:30')).toBe('09:30:00');
      expect(parseSurveyTimeToHms('23:59')).toBe('23:59:00');
    });

    it('rejects invalid times', () => {
      expect(parseSurveyTimeToHms('24:00:00')).toBeNull();
      expect(parseSurveyTimeToHms('12:60:00')).toBeNull();
      expect(parseSurveyTimeToHms('12:00:60')).toBeNull();
      expect(parseSurveyTimeToHms('9:30:00')).toBeNull();
      expect(parseSurveyTimeToHms('not-a-time')).toBeNull();
    });
  });

  describe('isValidSurveyTimeBody', () => {
    it('matches only HH:mm:ss', () => {
      expect(isValidSurveyTimeBody('09:05:00')).toBe(true);
      expect(isValidSurveyTimeBody('09:05')).toBe(false);
      expect(isValidSurveyTimeBody('')).toBe(false);
    });
  });

  describe('formatSurveyTimeFromDate', () => {
    it('formats time of day', () => {
      expect(formatSurveyTimeFromDate(new Date(2020, 0, 1, 14, 5, 6))).toBe('14:05:06');
    });

    it('returns null for invalid date', () => {
      expect(formatSurveyTimeFromDate(new Date('invalid'))).toBeNull();
    });
  });
});
