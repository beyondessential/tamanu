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
  type Interval,
} from 'date-fns';
import { z } from 'zod';

import { TIME_UNIT_OPTIONS } from '@tamanu/constants';

export const ISO9075_DATE_FORMAT = 'yyyy-MM-dd';
export const ISO9075_DATETIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';
export const ISO8061_WITH_TIMEZONE = "yyyy-MM-dd'T'HH:mm:ssXXX";

export const isISOString = (dateString: string) =>
  isMatch(dateString, ISO9075_DATETIME_FORMAT) || isMatch(dateString, ISO9075_DATE_FORMAT);

const parseDateStringToDate = (dateString: string) =>
  isISOString(dateString) ? parseISO(dateString) : new Date(dateString.replace(' ', 'T'));
/**
 *
 * @param date - usually we are working with a ISO9075 date_time_string or date_string but could
 * also be a ISO8061 date string or a date object so we need to gracefully handle all of them.
 * If you know you are working with an ISO9075 date_time_string or date_string, just use parseIso
 * from date-fns
 */
export const parseDate = (date?: null | string | Date) => {
  if (date == null) return null;

  const dateObj = typeof date === 'string' ? parseDateStringToDate(date) : date;

  if (!isValid(dateObj)) throw new Error('Not a valid date');

  return dateObj;
};

export function toDateTimeString(date?: null | string | Date) {
  const dateObj = parseDate(date);
  if (!dateObj) return null;

  return formatISO9075(dateObj, { representation: 'complete' });
}

export function toDateString(date?: null | string | Date) {
  const dateObj = parseDate(date);
  if (!dateObj) return null;

  return formatISO9075(dateObj, { representation: 'date' });
}

export function getCurrentDateTimeString() {
  return formatISO9075(new Date());
}

export function getDateTimeSubtractedFromNow(daysToSubtract?: number) {
  return toDateTimeString(sub(new Date(), { days: daysToSubtract }));
}

export function getDateSubtractedFromToday(daysToSubtract?: number) {
  return toDateTimeString(sub(startOfDay(new Date()), { days: daysToSubtract }));
}

export function getCurrentDateString() {
  return formatISO9075(new Date(), { representation: 'date' });
}

// Don't use this function when using a datestring or datetimestring column
export function getCurrentISO8601DateString() {
  return new Date().toISOString();
}

export function convertISO9075toRFC3339(dateString?: null | string) {
  const parsedDate = dateString == null ? new Date() : parseISO(dateString);
  return dateFnsFormat(parsedDate, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
}

export function ageInWeeks(dob: string) {
  return differenceInWeeks(new Date(), parseISO(dob));
}

export function ageInMonths(dob: string) {
  return differenceInMonths(new Date(), parseISO(dob));
}

export function ageInYears(dob: string) {
  return differenceInYears(new Date(), parseISO(dob));
}

export function compareDateStrings(key: 'asc' | 'desc' | 'ASC' | 'DESC' = 'desc') {
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
}

type AgeRange = {
  ageMin: number;
  ageMax: number;
  ageUnit: string;
};

function getAgeRangeInMinutes({ ageMin = -Infinity, ageMax = Infinity, ageUnit }: AgeRange) {
  const timeUnit = TIME_UNIT_OPTIONS.find(option => option.unit === ageUnit);
  if (!timeUnit) throw new Error(`Unknown time unit: ${ageUnit}`);

  const conversionValue = timeUnit.minutes;
  return {
    ageMin: ageMin * conversionValue,
    ageMax: ageMax * conversionValue,
    previousAgeUnit: ageUnit,
  };
}

export function doAgeRangesHaveGaps(rangesArray: AgeRange[]) {
  const conversions: Record<
    string,
    // eslint-disable-next-line no-unused-vars
    Record<string, (a: Omit<AgeRange, 'ageUnit'>, b: Omit<AgeRange, 'ageUnit'>) => boolean>
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
  const normalized = rangesArray.map(getAgeRangeInMinutes);
  normalized.sort((a, b) => a.ageMin - b.ageMin);

  return normalized.some((rangeA, i) => {
    const rangeB = normalized[i + 1];
    // This means we reached the last item, nothing more to compare
    if (!rangeB) return false;

    if (rangeA.previousAgeUnit !== rangeB.previousAgeUnit) {
      // No conversion means that minute comparison is good
      const conversion = conversions[rangeA.previousAgeUnit]?.[rangeB.previousAgeUnit];
      if (conversion) {
        return conversion(rangeA, rangeB);
      }
    }
    // These have to forcefully match, otherwise a gap exists
    return rangeA.ageMax !== rangeB.ageMin;
  });
}

export function doAgeRangesOverlap(rangesArray: AgeRange[]) {
  return rangesArray.some((rangeA, aIndex) => {
    return rangesArray.some((rangeB, bIndex) => {
      // Only compare once between two ranges
      if (aIndex >= bIndex) return false;

      // Get both values into same time unit
      const aInMinutes = getAgeRangeInMinutes(rangeA);
      const bInMinutes = getAgeRangeInMinutes(rangeB);

      // Figure out the lowest min range
      const lowestMin = aInMinutes.ageMin < bInMinutes.ageMin ? aInMinutes : bInMinutes;
      const highestMin = aInMinutes.ageMin < bInMinutes.ageMin ? bInMinutes : aInMinutes;
      const lowestAgeMax = lowestMin.ageMax;
      const highestAgeMin = highestMin.ageMin;

      // Min inclusive - max exclusive: only overlaps if its less than
      return highestAgeMin < lowestAgeMax;
    });
  });
}

/*
 * date-fns wrappers
 * Wrapper functions around date-fns functions that parse date_string and date_time_string types
 * For date-fns docs @see https://date-fns.org
 */

export const format = (date: null | undefined | string | Date, format: string) => {
  if (date == null) return null;

  const dateObj = parseDate(date);
  if (!dateObj) return null;

  return dateFnsFormat(dateObj, format);
};

export const differenceInMilliseconds = (a: Date | number, b: Date | number) =>
  dateFnsDifferenceInMilliseconds(new Date(a), new Date(b));

const intlFormatDate = (
  date: string,
  formatOptions: Intl.DateTimeFormatOptions,
  fallback = 'Unknown',
) => {
  if (!date) return fallback;
  const globalVars: Record<string, unknown> = globalThis;
  const locale =
    typeof globalVars.navigator === 'object' &&
    globalVars.navigator !== null &&
    'language' in globalVars.navigator &&
    typeof globalVars.navigator.language === 'string'
      ? globalVars.navigator.language
      : 'default';
  return parseISO(date).toLocaleString(locale, formatOptions);
};

export const formatShortest = (date: string) =>
  intlFormatDate(date, { month: '2-digit', day: '2-digit', year: '2-digit' }, '--/--'); // 12/04/20

export const formatShort = (date: string) =>
  intlFormatDate(date, { day: '2-digit', month: '2-digit', year: 'numeric' }, '--/--/----'); // 12/04/2020

export const formatTime = (date: string) =>
  intlFormatDate(
    date,
    {
      timeStyle: 'short',
      hour12: true,
    },
    '__:__',
  ); // 12:30 am

export const formatTimeWithSeconds = (date: string) =>
  intlFormatDate(
    date,
    {
      timeStyle: 'medium',
      hour12: true,
    },
    '__:__:__',
  ); // 12:30:00 am

// long format date is displayed on hover
export const formatLong = (date: string) =>
  intlFormatDate(
    date,
    {
      timeStyle: 'short',
      dateStyle: 'full',
      hour12: true,
    },
    'Date information not available',
  ); // "Thursday, 14 July 2022, 03:44 pm"

export const isStartOfThisWeek = (date: number | Date) => {
  const startOfThisWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
  return isSameDay(date, startOfThisWeek);
};

// Custom validator for "YYYY-MM-DD HH:MM:SS" format
export const datetimeCustomValidation = z.string().refine(
  val => {
    const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
    if (!regex.test(val)) return false;

    const date = new Date(val);
    return isValid(date);
  },
  {
    message: 'Invalid datetime format, expected YYYY-MM-DD HH:MM:SS',
  },
);

export const endpointsOfDay = (date: Date| number) => [startOfDay(date), endOfDay(date)];

/** Returns `true` if and only if `interval1` is a subset of `interval2`. It need not be a strict subset. */
export const isIntervalWithinInterval = (interval1: Interval, interval2: Interval) => {
  const { start, end } = interval1;
  return isWithinInterval(start, interval2) && isWithinInterval(end, interval2);
};

/** Returns `true` if and only if `date` is an element of [`interval.start`, `interval.end`). */
export const isWithinIntervalExcludingEnd = (date: Date| number, interval: Interval) =>
  isBefore(date, interval.end) && isWithinInterval(date, interval);


const isValidDate = (date: unknown): date is Date | number => isValid(date);

export const maxValidDate = (dates: unknown[]) => {
  const validDates = dates.filter(isValidDate);
  return validDates.length === 0 ? null : max(validDates);
};

export const minValidDate = (dates: unknown[]) => {
  const validDates = dates.filter(isValidDate);
  return validDates.length === 0 ? null : min(validDates);
};
