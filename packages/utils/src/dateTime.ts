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
import { Temporal } from 'temporal-polyfill';
import { z } from 'zod';

import { TIME_UNIT_OPTIONS } from '@tamanu/constants';

export const ISO9075_DATE_FORMAT = 'yyyy-MM-dd';
export const ISO9075_DATETIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';
export const ISO8061_WITH_TIMEZONE = "yyyy-MM-dd'T'HH:mm:ssXXX";

export const isISOString = (dateString: string) =>
  isMatch(dateString, ISO9075_DATETIME_FORMAT) || isMatch(dateString, ISO9075_DATE_FORMAT);

export const isISO9075DateString = (dateString: string) => isMatch(dateString, ISO9075_DATE_FORMAT);

/** Extracts the date portion (YYYY-MM-DD) from a datetime string, returning null/undefined as-is. */
export const trimToDate = (date: string | null | undefined): string | null | undefined =>
  date?.slice(0, 10);

/** Extracts the time portion (HH:mm:ss) from a datetime string, returning null/undefined as-is. */
export const trimToTime = (date: string | null | undefined): string | null | undefined =>
  date?.slice(11, 19);

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

const pad = (n: number) => String(n).padStart(2, '0');

const toISO9075DateTime = (dt: Temporal.PlainDateTime | Temporal.ZonedDateTime) => {
  const { year, month, day, hour, minute, second } = dt;
  return `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}:${pad(second)}`;
};

const toDateTimeLocalFormat = (dt: Temporal.PlainDateTime | Temporal.ZonedDateTime) =>
  dt.toString().slice(0, 16);

const parseDateTimeString = (date: string) => Temporal.PlainDateTime.from(date.replace(' ', 'T'));

const getDisplayTimezone = (countryTimeZone?: string, facilityTimeZone?: string | null) =>
  facilityTimeZone ?? countryTimeZone;

export const intlFormatDate = (
  date: string | Date | null | undefined,
  formatOptions: Intl.DateTimeFormatOptions,
  fallback = 'Unknown',
  countryTimeZone?: string,
  facilityTimeZone?: string | null,
) => {
  if (!date) return fallback;

  try {
    if (date instanceof Date) {
      if (!isValid(date)) return fallback;
      return date.toLocaleString(locale, formatOptions);
    }

    if (isISO9075DateString(date)) {
      return Temporal.PlainDate.from(date).toLocaleString(locale, formatOptions);
    }

    const displayTz = getDisplayTimezone(countryTimeZone, facilityTimeZone);
    const plain = parseDateTimeString(date);

    if (countryTimeZone && displayTz) {
      return plain
        .toZonedDateTime(countryTimeZone)
        .withTimeZone(displayTz)
        .toLocaleString(locale, formatOptions);
    }

    return plain.toLocaleString(locale, formatOptions);
  } catch {
    return fallback;
  }
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

/** Get current datetime string in a specific timezone */
export const getCurrentDateTimeStringInTimezone = (timezone?: string) =>
  toISO9075DateTime(Temporal.Now.zonedDateTimeISO(timezone ?? Temporal.Now.timeZoneId()));

/** Get current date string in a specific timezone */
export const getCurrentDateStringInTimezone = (timezone?: string) =>
  Temporal.Now.plainDateISO(timezone ?? Temporal.Now.timeZoneId()).toString();

/**
 * Convert stored datetime (country timezone) to display format (facility timezone)
 * Used when populating datetime-local inputs with existing values
 */
export const formatForDateTimeInput = (
  value: string | Date | null | undefined,
  countryTimeZone?: string,
  facilityTimeZone?: string | null,
): string | null => {
  if (value == null) return null;

  try {
    const displayTz = getDisplayTimezone(countryTimeZone, facilityTimeZone);

    if (value instanceof Date) {
      if (!isValid(value)) return null;
      const instant = Temporal.Instant.fromEpochMilliseconds(value.getTime());
      return toDateTimeLocalFormat(
        instant.toZonedDateTimeISO(displayTz ?? Temporal.Now.timeZoneId()),
      );
    }

    if (isISO9075DateString(value)) {
      return `${value}T00:00`;
    }

    const plain = parseDateTimeString(value);
    if (countryTimeZone && displayTz) {
      return toDateTimeLocalFormat(plain.toZonedDateTime(countryTimeZone).withTimeZone(displayTz));
    }

    return toDateTimeLocalFormat(plain);
  } catch {
    return null;
  }
};

/**
 * Convert input value (facility timezone) to storage format (country timezone)
 * Used when saving datetime-local input values to the database
 */
export const toDateTimeStringForPersistence = (
  inputValue: string | null | undefined,
  countryTimeZone?: string,
  facilityTimeZone?: string | null,
): string | null => {
  if (!inputValue) return null;

  try {
    const plain = parseDateTimeString(inputValue);

    if (!countryTimeZone) {
      return toISO9075DateTime(plain);
    }
    const displayTz = facilityTimeZone ?? countryTimeZone;
    return toISO9075DateTime(plain.toZonedDateTime(displayTz).withTimeZone(countryTimeZone));
  } catch {
    return null;
  }
};

export const getDayBoundaries = (
  date: string,
  countryTimeZone?: string,
  facilityTimeZone?: string | null,
) => {
  const start = toDateTimeStringForPersistence(
    `${date}T00:00:00`,
    countryTimeZone,
    facilityTimeZone,
  );
  const end = toDateTimeStringForPersistence(`${date}T23:59:59`, countryTimeZone, facilityTimeZone);
  if (!start || !end) return null;
  return {
    start,
    end,
  };
};
