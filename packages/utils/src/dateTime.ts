import {
  differenceInMilliseconds as dateFnsDifferenceInMilliseconds,
  format as dateFnsFormat,
  differenceInMonths,
  differenceInWeeks,
  differenceInYears,
  endOfDay,
  formatISO9075,
  isBefore,
  isMatch,
  isSameDay,
  isValid,
  isWithinInterval,
  max,
  min,
  parseISO,
  startOfDay,
  startOfWeek,
  sub,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  type DurationUnit,
  type Interval,
} from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { z } from 'zod';

import { TIME_UNIT_OPTIONS } from '@tamanu/constants';

export const ISO9075_DATE_FORMAT = 'yyyy-MM-dd';
export const ISO9075_DATETIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';
export const ISO8061_WITH_TIMEZONE = "yyyy-MM-dd'T'HH:mm:ssXXX";

export const isISOString = (dateString: string) =>
  isMatch(dateString, ISO9075_DATETIME_FORMAT) || isMatch(dateString, ISO9075_DATE_FORMAT);

export const isISO9075DateString = (dateString: string) => isMatch(dateString, ISO9075_DATE_FORMAT);

const makeDateObject = (date: string | Date) => {
  if (typeof date !== 'string') return date;
  return isISOString(date) ? parseISO(date) : new Date(date.replace(' ', 'T'));
};

/**
 *
 * @param date - usually we are working with a ISO9075 date_time_string or date_string but could
 * also be a ISO8061 date string or a date object so we need to gracefully handle all of them.
 * If you know you are working with an ISO9075 date_time_string or date_string, just use parseIso
 * from date-fns
 */
export const parseDate = (date: string | Date | null | undefined) => {
  if (date == null) return null;

  // Handle empty strings
  if (typeof date === 'string' && date.trim() === '') return null;

  const dateObj = makeDateObject(date);
  if (!isValid(dateObj)) throw new Error('Not a valid date');
  return dateObj;
};

export const toDateTimeString = (date: string | Date | null | undefined) => {
  if (date == null) return null;

  const dateObj = parseDate(date);
  if (!dateObj) return null;

  return formatISO9075(dateObj, { representation: 'complete' });
};

export const toDateString = (date: string | Date | null | undefined) => {
  if (date == null) return null;

  const dateObj = parseDate(date);
  if (!dateObj) return null;

  return formatISO9075(dateObj, { representation: 'date' });
};

/** "MO" - Uppercase 2 letter weekday representation for scheduling */
export const toWeekdayCode = (date: string | Date | null | undefined) => {
  if (date == null) return null;

  const dateObj = parseDate(date);
  if (!dateObj) return null;

  return dateFnsFormat(dateObj, 'iiiiii').toUpperCase();
};

export const getCurrentDateTimeString = () => formatISO9075(new Date());

export const getDateTimeSubtractedFromNow = (daysToSubtract: number) => {
  return toDateTimeString(sub(new Date(), { days: daysToSubtract }));
};

// export const getDateSubtractedFromToday = (daysToSubtract: number) => {
//   return toDateTimeString(sub(startOfDay(new Date()), { days: daysToSubtract }));
// };

export const getCurrentDateString = () => formatISO9075(new Date(), { representation: 'date' });

/**
 *  Don't use this function when using a datestring or datetimestring column
 */
export const getCurrentISO8601DateString = () => new Date().toISOString();

export const convertISO9075toRFC3339 = (dateString: string | null | undefined) => {
  const parsedDate = dateString == null ? new Date() : parseISO(dateString);
  return dateFnsFormat(parsedDate, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
};

export const ageInWeeks = (dob: string) => {
  return differenceInWeeks(new Date(), parseISO(dob));
};

export const ageInMonths = (dob: string) => {
  return differenceInMonths(new Date(), parseISO(dob));
};

export const ageInYears = (dob: string) => {
  return differenceInYears(new Date(), parseISO(dob));
};

export const compareDateStrings = (key: 'asc' | 'desc' | 'ASC' | 'DESC' = 'desc') => {
  return (a: { date: string }, b: { date: string }) => {
    switch (key) {
      case 'asc':
      case 'ASC':
        return parseISO(a.date).getTime() - parseISO(b.date).getTime();
      case 'desc':
      case 'DESC':
        return parseISO(b.date).getTime() - parseISO(a.date).getTime();
      default:
        return 0;
    }
  };
};

export type AgeRange = {
  ageMin: number;
  ageMax: number;
  ageUnit: DurationUnit;
};

const getAgeRangeInMinutes = ({ ageMin = -Infinity, ageMax = Infinity, ageUnit }: AgeRange) => {
  const timeUnit = TIME_UNIT_OPTIONS.find(option => option.unit === ageUnit);
  if (!timeUnit) return null;

  const conversionValue = timeUnit.minutes;
  return {
    ageMin: ageMin * conversionValue,
    ageMax: ageMax * conversionValue,
    previousAgeUnit: ageUnit,
  };
};

export const doAgeRangesHaveGaps = (rangesArray: AgeRange[]) => {
  const conversions: Partial<
    Record<
      DurationUnit,
      Partial<
        Record<
          DurationUnit,
          // eslint-disable-next-line no-unused-vars
          (a: Omit<AgeRange, 'ageUnit'>, b: Omit<AgeRange, 'ageUnit'>) => boolean
        >
      >
    >
  > = {
    weeks: {
      months: (a, b) => {
        const weeks = a.ageMax / 60 / 24 / 7;
        const months = b.ageMin / 60 / 24 / 30;
        return weeks / 4 !== months;
      },
      years: (a, b) => {
        const weeks = a.ageMax / 60 / 24 / 7;
        const years = b.ageMin / 60 / 24 / 365;
        return weeks / 52 !== years;
      },
    },
    months: {
      years: (a, b) => {
        const months = a.ageMax / 60 / 24 / 30;
        const years = b.ageMin / 60 / 24 / 365;
        return months / 12 !== years;
      },
    },
  };

  // Get all values into same time unit and sort by ageMin low to high
  const normalized = rangesArray.map(getAgeRangeInMinutes).filter(range => range !== null);
  normalized.sort((a, b) => a.ageMin - b.ageMin);

  return normalized.some((rangeA, i) => {
    const rangeB = normalized[i + 1];
    // This means we reached the last item, nothing more to compare
    if (!rangeB) return false;

    if (rangeA.previousAgeUnit !== rangeB.previousAgeUnit) {
      // No conversion means that minute comparison is good
      const conversion = conversions[rangeA.previousAgeUnit]?.[rangeB.previousAgeUnit];
      if (conversion) return conversion(rangeA, rangeB);
    }
    // These have to forcefully match, otherwise a gap exists
    return rangeA.ageMax !== rangeB.ageMin;
  });
};

export const doAgeRangesOverlap = (rangesArray: AgeRange[]) => {
  return rangesArray.some((rangeA, aIndex) => {
    return rangesArray.some((rangeB, bIndex) => {
      // Only compare once between two ranges
      if (aIndex >= bIndex) return false;

      // Get both values into same time unit
      const aInMinutes = getAgeRangeInMinutes(rangeA);
      const bInMinutes = getAgeRangeInMinutes(rangeB);

      if (!aInMinutes || !bInMinutes) return false;

      // Figure out the lowest min range
      const lowestMin = aInMinutes.ageMin < bInMinutes.ageMin ? aInMinutes : bInMinutes;
      const highestMin = aInMinutes.ageMin < bInMinutes.ageMin ? bInMinutes : aInMinutes;
      const lowestAgeMax = lowestMin.ageMax;
      const highestAgeMin = highestMin.ageMin;

      // Min inclusive - max exclusive: only overlaps if its less than
      return highestAgeMin < lowestAgeMax;
    });
  });
};

/*
 * date-fns wrappers
 * Wrapper functions around date-fns functions that parse date_string and date_time_string types
 * For date-fns docs @see https://date-fns.org
 */
export const format = (date: string | Date | null | undefined, format: string) => {
  if (date == null) return null;
  const dateObj = parseDate(date);
  if (!dateObj) return null;

  return dateFnsFormat(dateObj, format);
};

export const differenceInMilliseconds = (a: number | string | Date, b: number | string | Date) =>
  dateFnsDifferenceInMilliseconds(new Date(a), new Date(b));

export const locale = globalThis.navigator?.language ?? 'default';

export const intlFormatDate = (
  date: string | Date | null | undefined,
  formatOptions: Intl.DateTimeFormatOptions,
  fallback = 'Unknown',
  countryTimeZone?: string,
  facilityTimeZone?: string | null,
) => {
  if (!date) return fallback;

  // Date objects: display in local time (no timezone conversion)
  if (date instanceof Date) {
    if (!isValid(date)) return fallback;
    return date.toLocaleString(locale, formatOptions);
  }

  // Date-only strings (e.g. DOB): display as-is, no timezone shift
  // We use UTC here because the date-only string is not timezone aware and we want to display it with no offset
  if (isISO9075DateString(date)) {
    const dateObj = new Date(date);
    if (!isValid(dateObj)) return fallback;
    return dateObj.toLocaleString(locale, { ...formatOptions, timeZone: 'UTC' });
  }

  // Datetime strings: apply timezone conversion if timezone provided
  const dateObj =
    countryTimeZone && facilityTimeZone ? fromZonedTime(date, countryTimeZone) : parseDate(date);
  if (!dateObj) return fallback;

  const timeZone = facilityTimeZone ?? countryTimeZone;
  if (timeZone) {
    formatOptions.timeZone = timeZone;
  }
  return dateObj.toLocaleString(locale, formatOptions);
};

export const isStartOfThisWeek = (date: Date | number) => {
  const startOfThisWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
  return isSameDay(date, startOfThisWeek);
};

// Custom validator for "YYYY-MM-DD" format
export const dateCustomValidation = z
  .string()
  .refine(
    (val: string) => {
      const regex = /^\d{4}-\d{2}-\d{2}$/;
      if (!regex.test(val)) return false;

      const date = new Date(val);
      return isValid(date);
    },
    {
      message: 'Invalid date format, expected YYYY-MM-DD',
    },
  )
  .describe('__dateCustomValidation__');

export const timeCustomValidation = z.string().refine(
  (val: string) => {
    const regex = /^\d{2}:\d{2}:\d{2}$/;
    if (!regex.test(val)) return false;
    return true;
  },
  {
    message: 'Invalid time format, expected HH:MM:SS',
  },
);

// Custom validator for "YYYY-MM-DD HH:MM:SS" format
export const datetimeCustomValidation = z
  .string()
  .refine(
    (val: string) => {
      const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
      if (!regex.test(val)) return false;

      const date = new Date(val);
      return isValid(date);
    },
    {
      message: 'Invalid datetime format, expected YYYY-MM-DD HH:MM:SS',
    },
  )
  .describe('__datetimeCustomValidation__');

export const endpointsOfDay = (date: Date | number) => [startOfDay(date), endOfDay(date)];

/** Returns `true` if and only if `interval1` is a subset of `interval2`. It need not be a strict subset. */
export const isIntervalWithinInterval = (interval1: Interval, interval2: Interval) => {
  const { start, end } = interval1;
  return isWithinInterval(start, interval2) && isWithinInterval(end, interval2);
};

/** Returns `true` if and only if `date` is an element of [`interval.start`, `interval.end`). */
export const isWithinIntervalExcludingEnd = (date: Date | number, interval: Interval) =>
  isBefore(date, interval.end) && isWithinInterval(date, interval);

export const maxValidDate = (dates: (Date | number)[]) => {
  const validDates = dates.filter(isValid);
  return validDates.length === 0 ? null : max(validDates);
};

export const minValidDate = (dates: (Date | number)[]) => {
  const validDates = dates.filter(isValid);
  return validDates.length === 0 ? null : min(validDates);
};

export const eachDayInMonth = (date: Date) =>
  eachDayOfInterval({
    start: startOfMonth(date),
    end: endOfMonth(date),
  });

/**
 * Get current datetime string in a specific timezone
 * Used for default "today" values in facility timezone
 */
export const getCurrentDateTimeStringInTimezone = (timezone: string) =>
  formatInTimeZone(new Date(), timezone, ISO9075_DATETIME_FORMAT);

/**
 * Get current date string in a specific timezone
 */
export const getCurrentDateStringInTimezone = (timezone: string) =>
  formatInTimeZone(new Date(), timezone, ISO9075_DATE_FORMAT);

/**
 * Convert a datetime-local input value (displayed in facility timezone) to a datetime string
 * in the country timezone for persistence.
 *
 * @param inputValue - Value from datetime-local input (format: yyyy-MM-dd'T'HH:mm)
 * @param countryTimeZone - The timezone to persist the date in
 * @param facilityTimeZone - The timezone the input is displayed in (optional)
 * @returns ISO9075 datetime string in country timezone, or null if invalid
 */
export const toDateTimeStringForPersistence = (
  inputValue: string | null | undefined,
  countryTimeZone?: string,
  facilityTimeZone?: string | null,
): string | null => {
  if (!inputValue) return null;

  // If no timezones configured, just parse and format directly
  if (!countryTimeZone) {
    const date = parseDate(inputValue);
    return date ? formatISO9075(date, { representation: 'complete' }) : null;
  }

  // The input value represents a time in the display timezone (facility or country)
  const displayTimezone = facilityTimeZone ?? countryTimeZone;

  // Convert the input (which is in displayTimezone) to a UTC Date
  const utcDate = fromZonedTime(inputValue, displayTimezone);
  if (!isValid(utcDate)) return null;

  // Format the date in country timezone for persistence
  return formatInTimeZone(utcDate, countryTimeZone, ISO9075_DATETIME_FORMAT);
};

/**
 * Format a datetime-local input value for display in facility timezone
 * Used when populating inputs with existing values from the database
 *
 * @param value - Stored datetime value (in country timezone)
 * @param countryTimeZone - The timezone the value is stored in
 * @param facilityTimeZone - The timezone to display in (optional)
 * @returns Formatted string for datetime-local input, or null if invalid
 */
export const formatForDateTimeInput = (
  value: string | Date | null | undefined,
  countryTimeZone?: string,
  facilityTimeZone?: string | null,
): string | null => {
  if (value == null) return null;

  const displayTimezone = facilityTimeZone ?? countryTimeZone;

  // If no timezone configured, format directly
  if (!displayTimezone) {
    const dateObj = parseDate(value);
    if (!dateObj) return null;
    return dateFnsFormat(dateObj, "yyyy-MM-dd'T'HH:mm");
  }

  // Parse the stored value (in country timezone) to UTC
  const dateObj = countryTimeZone ? fromZonedTime(value, countryTimeZone) : parseDate(value);
  if (!dateObj || !isValid(dateObj)) return null;

  // Format in display timezone for the input
  return formatInTimeZone(dateObj, displayTimezone, "yyyy-MM-dd'T'HH:mm");
};
