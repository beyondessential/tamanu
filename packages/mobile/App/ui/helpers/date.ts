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
