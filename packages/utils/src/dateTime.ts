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
import { has } from 'lodash';
import { Temporal } from 'temporal-polyfill';
import { z } from 'zod';

import { TIME_UNIT_OPTIONS } from '@tamanu/constants';

// ---------------------------------------------------------------------------
// Common types
// ---------------------------------------------------------------------------

export type DateInput = string | Date | null | undefined;

// ---------------------------------------------------------------------------
// Format constants & matchers
// ---------------------------------------------------------------------------

export const ISO9075_DATE_FORMAT = 'yyyy-MM-dd';
export const ISO9075_DATETIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';

export const isISOString = (dateString: string) =>
  isMatch(dateString, ISO9075_DATETIME_FORMAT) || isMatch(dateString, ISO9075_DATE_FORMAT);

export const isISO9075DateString = (dateString: string) => isMatch(dateString, ISO9075_DATE_FORMAT);

// ---------------------------------------------------------------------------
// Parsing & conversion
// ---------------------------------------------------------------------------

/** Extracts the date portion (YYYY-MM-DD) from a datetime string, returning null/undefined as-is. */
export const trimToDate = (date: string | null | undefined): string | null | undefined =>
  date?.slice(0, 10);

/** Extracts the time portion (HH:mm:ss) from a datetime string */
export const trimToTime = (date: string | null | undefined): string | null | undefined => {
  const time = date?.slice(11, 19);
  return time?.length === 5 ? `${time}:00` : time;
};


const makeDateObject = (date: string | Date) => {
  if (typeof date !== 'string') return date;
  return isISOString(date) ? parseISO(date) : new Date(date.replace(' ', 'T'));
};

/**
 * @param date - usually an ISO 9075 date_time_string or date_string but could
 * also be an ISO 8601 date string or Date object. Handles all gracefully.
 * If you know you have an ISO 9075 string, just use parseISO from date-fns.
 */
export const parseDate = (date: DateInput) => {
  if (date == null) return null;
  if (typeof date === 'string' && date.trim() === '') return null;

  const dateObj = makeDateObject(date);
  if (!isValid(dateObj)) throw new Error('Not a valid date');
  return dateObj;
};

export const toDateTimeString = (date: DateInput) => {
  const parsed = parseDate(date);
  return parsed ? formatISO9075(parsed, { representation: 'complete' }) : null;
};

export const toDateString = (date: DateInput) => {
  const parsed = parseDate(date);
  return parsed ? formatISO9075(parsed, { representation: 'date' }) : null;
};

/** "MO" - Uppercase 2 letter weekday representation for scheduling */
export const toWeekdayCode = (date: DateInput) => {
  const parsed = parseDate(date);
  return parsed ? dateFnsFormat(parsed, 'iiiiii').toUpperCase() : null;
};

// ---------------------------------------------------------------------------
// "Now" helpers (server-side only — not timezone-aware)
// ---------------------------------------------------------------------------

/**
 * Get ISO 9075 date string for current date.
 * Note: Not timezone-aware — use getCurrentDate from DateTimeContext on the client.
 */
export const getCurrentDateString = () => formatISO9075(new Date(), { representation: 'date' });

/**
 * Get ISO 9075 datetime string for current datetime.
 * Note: Not timezone-aware — use getCurrentDateTime from DateTimeContext on the client.
 */
export const getCurrentDateTimeString = () => formatISO9075(new Date());

export const getDateTimeSubtractedFromNow = (daysToSubtract: number) =>
  toDateTimeString(sub(new Date(), { days: daysToSubtract }));

/** Don't use this when targeting a datestring or datetimestring column */
export const getCurrentISO8601DateString = () => new Date().toISOString();

export const convertISO9075toRFC3339 = (dateString: string | null | undefined) => {
  const parsedDate = dateString == null ? new Date() : parseISO(dateString);
  return dateFnsFormat(parsedDate, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
};

// ---------------------------------------------------------------------------
// Age helpers
// ---------------------------------------------------------------------------

const ageIn = (diffFn: (a: Date, b: Date) => number) => (dob: string) =>
  diffFn(new Date(), parseISO(dob));

export const ageInWeeks = ageIn(differenceInWeeks);
export const ageInMonths = ageIn(differenceInMonths);
export const ageInYears = ageIn(differenceInYears);

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

type MinutesRange = Omit<AgeRange, 'ageUnit'>;
type CrossUnitComparator = (a: MinutesRange, b: MinutesRange) => boolean;

export const doAgeRangesHaveGaps = (rangesArray: AgeRange[]) => {
  const conversions: Partial<
    Record<DurationUnit, Partial<Record<DurationUnit, CrossUnitComparator>>>
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
    if (!rangeB) return false;

    if (rangeA.previousAgeUnit !== rangeB.previousAgeUnit) {
      // Cross-unit boundary — minute comparison may not be reliable, use explicit conversion
      const conversion = conversions[rangeA.previousAgeUnit]?.[rangeB.previousAgeUnit];
      if (conversion) return conversion(rangeA, rangeB);
    }
    return rangeA.ageMax !== rangeB.ageMin;
  });
};

export const doAgeRangesOverlap = (rangesArray: AgeRange[]) =>
  rangesArray.some((rangeA, aIndex) =>
    rangesArray.some((rangeB, bIndex) => {
      if (aIndex >= bIndex) return false;

      const a = getAgeRangeInMinutes(rangeA);
      const b = getAgeRangeInMinutes(rangeB);
      if (!a || !b) return false;

      // Min inclusive, max exclusive — standard half-open interval overlap check
      return a.ageMin < b.ageMax && b.ageMin < a.ageMax;
    }),
  );

// ---------------------------------------------------------------------------
// date-fns wrappers
// Wrappers that accept date_string / date_time_string types.
// For date-fns docs @see https://date-fns.org
// ---------------------------------------------------------------------------

export const format = (date: DateInput, formatStr: string) => {
  const parsed = parseDate(date);
  return parsed ? dateFnsFormat(parsed, formatStr) : null;
};

export const differenceInMilliseconds = (a: number | string | Date, b: number | string | Date) =>
  dateFnsDifferenceInMilliseconds(new Date(a), new Date(b));

export const locale = globalThis.navigator?.language ?? 'default';

export const isStartOfThisWeek = (date: Date | number) =>
  isSameDay(date, startOfWeek(new Date(), { weekStartsOn: 1 }));

export const endpointsOfDay = (date: Date | number) => [startOfDay(date), endOfDay(date)];

/** Returns `true` iff `interval1` is a subset of `interval2` (not necessarily strict). */
export const isIntervalWithinInterval = (interval1: Interval, interval2: Interval) => {
  const { start, end } = interval1;
  return isWithinInterval(start, interval2) && isWithinInterval(end, interval2);
};

/** Returns `true` iff `date` is in [`interval.start`, `interval.end`). */
export const isWithinIntervalExcludingEnd = (date: Date | number, interval: Interval) =>
  isBefore(date, interval.end) && isWithinInterval(date, interval);

const boundValidDate = (fn: typeof max) => (dates: (Date | number)[]) => {
  const validDates = dates.filter(isValid);
  return validDates.length === 0 ? null : fn(validDates);
};

export const maxValidDate = boundValidDate(max);
export const minValidDate = boundValidDate(min);

export const eachDayInMonth = (date: Date) =>
  eachDayOfInterval({
    start: startOfMonth(date),
    end: endOfMonth(date),
  });

// ---------------------------------------------------------------------------
// Zod validators
// ---------------------------------------------------------------------------

const iso9075Validator = (regex: RegExp, message: string) =>
  z.string().refine((val: string) => regex.test(val) && isValid(new Date(val)), { message });

export const dateCustomValidation = iso9075Validator(
  /^\d{4}-\d{2}-\d{2}$/,
  'Invalid date format, expected YYYY-MM-DD',
).describe('__dateCustomValidation__');

export const timeCustomValidation = z.string().refine(
  (val: string) => /^\d{2}:\d{2}:\d{2}$/.test(val),
  { message: 'Invalid time format, expected HH:MM:SS' },
);

export const datetimeCustomValidation = iso9075Validator(
  /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
  'Invalid datetime format, expected YYYY-MM-DD HH:MM:SS',
).describe('__datetimeCustomValidation__');

// ---------------------------------------------------------------------------
// Temporal / timezone helpers
// ---------------------------------------------------------------------------

const pad = (n: number) => String(n).padStart(2, '0');

const formatTemporal = (
  dt: Temporal.PlainDateTime | Temporal.ZonedDateTime,
  separator: string,
  alwaysIncludeSeconds: boolean,
) => {
  const { year, month, day, hour, minute, second } = dt;
  const yyyy = String(year).padStart(4, '0');
  const base = `${yyyy}-${pad(month)}-${pad(day)}${separator}${pad(hour)}:${pad(minute)}`;
  return alwaysIncludeSeconds || second !== 0 ? `${base}:${pad(second)}` : base;
};

const toISO9075DateTime = (dt: Temporal.PlainDateTime | Temporal.ZonedDateTime) =>
  formatTemporal(dt, ' ', true);

const toDateTimeLocalFormat = (dt: Temporal.PlainDateTime | Temporal.ZonedDateTime) =>
  formatTemporal(dt, 'T', false);

const parseDateTimeString = (date: string, primaryTimeZone: string): Temporal.PlainDateTime => {
  const normalized = date.replace(' ', 'T');
  if (/[Zz]$/.test(normalized)) {
    const instant = Temporal.Instant.from(normalized);
    const tz = primaryTimeZone ?? Temporal.Now.timeZoneId();
    return instant.toZonedDateTimeISO(tz).toPlainDateTime();
  }
  return Temporal.PlainDateTime.from(normalized);
};

const getDisplayTimezone = (primaryTimeZone: string, facilityTimeZone?: string | null) =>
  facilityTimeZone ?? primaryTimeZone;

const isTimezoneError = (error: unknown): boolean =>
  error instanceof RangeError && /time\s*zone/i.test(String(error));

const logDateError = (
  fnName: string,
  error: unknown,
  value: unknown,
  primaryTimeZone: string,
  facilityTimeZone?: string | null,
) => {
  if (isTimezoneError(error)) {
    console.error(
      `[${fnName}] Invalid timezone configuration — primaryTimeZone: ${JSON.stringify(primaryTimeZone)}, facilityTimeZone: ${JSON.stringify(facilityTimeZone)}. Error:`,
      error,
    );
  } else {
    console.warn(`[${fnName}] Failed to process date value ${JSON.stringify(value)}:`, error);
  }
};  

export const intlFormatDate = (
  date: DateInput,
  formatOptions: Intl.DateTimeFormatOptions,
  fallback = 'Unknown',
  primaryTimeZone: string,
  facilityTimeZone?: string | null,
) => {
  if (!date) return fallback;

  try {
    if (date instanceof Date) {
      if (!isValid(date)) return fallback;
      return date.toLocaleString(locale, formatOptions);
    }

    if (isISO9075DateString(date)) {
      const plainDate = Temporal.PlainDate.from(date);
      const timeKeys = ['hour', 'minute', 'second', 'timeStyle', 'dayPeriod'] as const;
      const hasTimeOptions = timeKeys.some(key => has(formatOptions, key));
      if (hasTimeOptions) {
        return plainDate.toPlainDateTime().toLocaleString(locale, formatOptions);
      }
      return plainDate.toLocaleString(locale, formatOptions);
    }

    const displayTz = getDisplayTimezone(primaryTimeZone, facilityTimeZone);
    const plain = parseDateTimeString(date, primaryTimeZone);

    if (primaryTimeZone && displayTz) {
      return plain
        .toZonedDateTime(primaryTimeZone)
        .withTimeZone(displayTz)
        .toLocaleString(locale, formatOptions);
    }

    return plain.toLocaleString(locale, formatOptions);
  } catch (error) {
    logDateError('intlFormatDate', error, date, primaryTimeZone, facilityTimeZone);
    return fallback;
  }
};

/** Get current datetime string in a specific timezone (ISO 9075 — space-separated, for storage) */
export const getCurrentDateTimeStringInTimezone = (timezone: string) =>
  toISO9075DateTime(Temporal.Now.zonedDateTimeISO(timezone ?? Temporal.Now.timeZoneId()));

/** Get current date string in a specific timezone */
export const getCurrentDateStringInTimezone = (timezone: string) =>
  Temporal.Now.plainDateISO(timezone ?? Temporal.Now.timeZoneId()).toString();

/** Get current facility date object in facility timezone */
export const getFacilityNowDate = (
  primaryTimeZone: string,
  facilityTimeZone?: string | null,
): Date => {
  const tz = facilityTimeZone ?? primaryTimeZone;
  return new Date(getCurrentDateTimeStringInTimezone(tz).replace(' ', 'T'));
};

/**
 * Convert stored datetime (primary timezone) to display format (facility timezone).
 * Used when populating datetime-local inputs with existing values.
 */
export const toFacilityDateTime = (
  value: DateInput,
  primaryTimeZone: string,
  facilityTimeZone?: string | null,
): string | null => {
  if (value == null) return null;

  try {
    const displayTz = getDisplayTimezone(primaryTimeZone, facilityTimeZone);

    if (value instanceof Date) {
      if (!isValid(value)) return null;
      const instant = Temporal.Instant.fromEpochMilliseconds(value.getTime());
      return toDateTimeLocalFormat(
        instant.toZonedDateTimeISO(displayTz ?? Temporal.Now.timeZoneId()),
      );
    }

    if (isISO9075DateString(value)) {
      // Omit seconds to match toDateTimeLocalFormat and HTML datetime-local input values
      return `${value}T00:00`;
    }

    const plain = parseDateTimeString(value, primaryTimeZone);
    if (primaryTimeZone && displayTz) {
      return toDateTimeLocalFormat(plain.toZonedDateTime(primaryTimeZone).withTimeZone(displayTz));
    }

    return toDateTimeLocalFormat(plain);
  } catch (error) {
    logDateError('toFacilityDateTime', error, value, primaryTimeZone, facilityTimeZone);
    return null;
  }
};

/**
 * Convert input value (facility timezone) to storage format (primary timezone).
 * Used when saving datetime-local input values to the database.
 */
export const toStoredDateTime = (
  inputValue: string | null | undefined,
  primaryTimeZone: string,
  facilityTimeZone?: string | null,
): string | null => {
  if (!inputValue) return null;

  try {
    if (/[Zz]$/.test(inputValue)) {
      const instant = Temporal.Instant.from(inputValue.replace(' ', 'T'));
      const tz = primaryTimeZone ?? Temporal.Now.timeZoneId();
      return toISO9075DateTime(instant.toZonedDateTimeISO(tz));
    }

    const plain = parseDateTimeString(inputValue, primaryTimeZone);

    if (!primaryTimeZone) {
      return toISO9075DateTime(plain);
    }
    const inputTz = getDisplayTimezone(primaryTimeZone, facilityTimeZone);
    return toISO9075DateTime(plain.toZonedDateTime(inputTz).withTimeZone(primaryTimeZone));
  } catch (error) {
    logDateError('toStoredDateTime', error, inputValue, primaryTimeZone, facilityTimeZone);
    return null;
  }
};

export const getDayBoundaries = (
  date: string,
  primaryTimeZone: string,
  facilityTimeZone?: string | null,
) => {
  const start = toStoredDateTime(`${date}T00:00:00`, primaryTimeZone, facilityTimeZone);
  const end = toStoredDateTime(`${date}T23:59:59`, primaryTimeZone, facilityTimeZone);
  if (!start || !end) return null;
  return { start, end };
};
