import {
  add as addDuration,
  isValid,
  format,
  parseISO,
  differenceInYears,
  intervalToDuration,
  formatISO9075,
  isMatch,
  differenceInMonths,
  differenceInWeeks,
  differenceInDays,
  formatDuration,
  startOfDay,
  formatDistance,
} from 'date-fns';

// Note: A lot of these functions are copied in from shared, i.e. are duplicates of functions in shared/utils/date.js

const ISO9075_DATE_FORMAT = 'yyyy-MM-dd';
const ISO9075_DATETIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';

const getDifferenceFnByUnit = {
  years: differenceInYears,
  months: differenceInMonths,
  weeks: differenceInWeeks,
  days: differenceInDays,
};

const comparators = {
  '>': (left, right) => left > right,
  '<': (left, right) => left < right,
  '>=': (left, right) => left >= right,
  '<=': (left, right) => left <= right,
};

export const isISOString = dateString =>
  isMatch(dateString, ISO9075_DATETIME_FORMAT) || isMatch(dateString, ISO9075_DATE_FORMAT);

/**
 *
 * @param date - usually we are working with a ISO9075 date_time_string or date_string but could
 * also be a ISO8061 date string or a date object so we need to gracefully handle all of them.
 * If you know you are working with an ISO9075 date_time_string or date_string, just use parseIso
 * from date-fns
 * @returns {null|Date} Outputs a Date object
 */
export const parseDate = date => {
  if (date === null || date === undefined) {
    return null;
  }
  let dateObj = date;

  if (isISOString(date)) {
    dateObj = parseISO(date);
  } else if (typeof date === 'string') {
    // It seems that some JS implementations have problems parsing strings to dates.
    dateObj = new Date(date.replace(' ', 'T'));
  }

  if (!isValid(dateObj)) {
    throw new Error('Not a valid date');
  }

  return dateObj;
};

export function formatDate(date: Date, dateFormat: string): string {
  return format(date, dateFormat);
}

export function formatPlainTime<T extends `${number}:${number}:${number}`>(
  time: T,
): `${string}:${string}${'am' | 'pm'}` | T {
  const match = time.match(/^(\d{2}):(\d{2})/);
  if (match) {
    const [, HH, mm] = match;
    const hour = Number.parseInt(HH, 10);
    const hh = (hour % 12).toString().padStart(2, '0');
    const a = hour < 12 ? 'am' : 'pm';
    return `${hh}:${mm}${a}`;
  }
  return time;
}

// Intl option bags corresponding to the DateFormats display constants
// (ui/helpers/constants.ts), keyed by their date-fns format strings. Option
// bags match @tamanu/utils/dateFormatters where the formats coincide.
const INTL_OPTIONS_BY_FORMAT: Record<string, Intl.DateTimeFormatOptions> = {
  // DateFormats.short
  'EEE, dd MMM': { weekday: 'short', day: '2-digit', month: 'short' },
  // DateFormats.DAY_MONTH_YEAR_SHORT
  'dd MMM yyyy': { day: '2-digit', month: 'short', year: 'numeric' },
  // DateFormats.DAY_MONTH
  'dd MMM': { day: '2-digit', month: 'short' },
  // DateFormats.DDMMYY
  'dd/MM/yyyy': { day: '2-digit', month: '2-digit', year: 'numeric' },
  // DateFormats.SHORT_MONTH
  MMM: { month: 'short' },
  // DateFormats.TIME_HHMMSS
  pp: { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true },
  // DateFormats.TIME
  p: { hour: 'numeric', minute: '2-digit', hour12: true },
};

// Combined date+time formats render as `${date} ${time}` rather than a single
// Intl format, which would insert a locale-specific separator (e.g. a comma)
// — matching how @tamanu/utils' formatShortDateTime composes its parts.
const COMBINED_FORMATS: Record<string, [string, string]> = {
  // DateFormats.DDMMYY_HHMMSS
  'dd/MM/yyyy pp': ['dd/MM/yyyy', 'pp'],
  // DateFormats.DATE_AND_TIME_HHMMSS
  'dd MMM yyyy pp': ['dd MMM yyyy', 'pp'],
  // DateFormats.DATE_AND_TIME_HHMM
  'dd MMM yyyy p': ['dd MMM yyyy', 'p'],
};

/**
 * Locale-aware display formatting: DateFormats constants are rendered with
 * Intl in the given locale (dateTimeLocale setting ?? device locale when
 * undefined); any other format string falls back to plain date-fns, so
 * storage formats (ISO 9075) can never become locale-dependent. Prefer
 * useDateFormatter() in components, which binds the effective locale.
 */
export function formatDateForDisplay(date: Date, dateFormat: string, locale?: string): string {
  const combined = COMBINED_FORMATS[dateFormat];
  if (combined) {
    const [datePart, timePart] = combined;
    return `${formatDateForDisplay(date, datePart, locale)} ${formatDateForDisplay(date, timePart, locale)}`;
  }
  const intlOptions = INTL_OPTIONS_BY_FORMAT[dateFormat];
  if (!intlOptions) {
    return format(date, dateFormat);
  }
  return new Intl.DateTimeFormat(locale, intlOptions).format(date);
}

export function formatStringDateForDisplay(
  date: string,
  dateFormat: string,
  locale?: string,
): string {
  if (!date) {
    return '';
  }
  return formatDateForDisplay(parseISO(date), dateFormat, locale);
}

export function getAgeFromDate(date: string): number {
  return differenceInYears(new Date(), parseISO(date));
}

export function getAgeDurationFromDate(date) {
  return intervalToDuration({ start: parseDate(date), end: new Date() });
}

export function getAgeWithMonthsFromDate(date: string): string {
  const { months, years } = intervalToDuration({
    start: parseISO(date),
    end: new Date(),
  });

  const yearPlural = years !== 1 ? 's' : '';
  const monthPlural = months !== 1 ? 's' : '';

  if (!years) {
    return `${months} month${monthPlural}`;
  }
  return `${years} year${yearPlural}, ${months} month${monthPlural}`;
}

export const toDateTimeString = (date: string | Date | null | undefined) => {
  if (date == null) return null;

  const dateObj = parseDate(date);
  if (!dateObj) return null;

  return formatISO9075(dateObj, { representation: 'complete' });
};

export function formatStringDate(date: string, dateFormat: string): string {
  if (!date) {
    return '';
  }

  const dateValue: Date = parseISO(date);
  return formatDate(dateValue, dateFormat);
}

export function getCurrentDateTimeString(): string {
  return formatISO9075(new Date());
}

export function getCombinedDateString(date: Date, time: Date): string {
  return formatISO9075(
    new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      time.getHours(),
      time.getMinutes(),
      time.getSeconds(),
      time.getMilliseconds(),
    ),
  );
}

export function getDisplayAge(dateOfBirth, ageDisplayFormat) {
  if (!ageDisplayFormat || !isISOString(dateOfBirth)) {
    return '';
  }
  const ageDuration = getAgeDurationFromDate(dateOfBirth);
  const birthDate = parseDate(dateOfBirth);
  for (const displayFormat of ageDisplayFormat) {
    const { as, range } = displayFormat;
    if (ageIsWithinRange(birthDate, range)) {
      const differenceFn = getDifferenceFnByUnit[as];
      const value = differenceFn(new Date(), birthDate);

      const unit = as.slice(0, -1); // slice off the s
      return `${value} ${unit}${value === 1 ? '' : 's'}`;
    }
  }

  return formatDuration(ageDuration, { format: ['years'] });
}

function ageIsWithinRange(birthDate, range) {
  const { min = {}, max = {} } = range;
  const { duration: minDuration, exclusive: minExclusive } = min;
  const { duration: maxDuration, exclusive: maxExclusive } = max;
  const minDate = minDuration ? startOfDay(addDuration(birthDate, minDuration)) : -Infinity;
  const maxDate = maxDuration ? startOfDay(addDuration(birthDate, maxDuration)) : Infinity;
  const now = startOfDay(new Date());
  return (
    (!minDate || compareDate(minDate, '<', now, minExclusive)) &&
    (!maxDate || compareDate(now, '<', maxDate, maxExclusive))
  );
}

function compareDate(leftDate, operator, rightDate, exclusive) {
  let comparator = operator;
  if (!exclusive) {
    comparator += '=';
  }
  const comparatorFn = comparators[comparator];

  return comparatorFn(leftDate, rightDate);
}

export function formatlastSuccessfulSyncTime(lastSuccessfulSyncTime: Date): string {
  return lastSuccessfulSyncTime
    ? formatDistance(lastSuccessfulSyncTime, new Date(), { addSuffix: true })
    : '';
}
