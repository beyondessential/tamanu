import {
  isValid,
  formatISO9075,
  differenceInMonths,
  differenceInYears,
  compareDesc,
  format as dateFnsFormat,
  differenceInMilliseconds as dateFnsDifferenceInMilliseconds,
  parseISO,
  isMatch,
} from 'date-fns';
import { ISO9075_DATE_FORMAT, ISO9075_DATETIME_FORMAT } from '../constants';

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
  }

  if (date === 'string') {
    dateObj = new Date(date);
  }

  if (!isValid(dateObj)) {
    throw new Error('Not a valid date');
  }

  return dateObj;
};

export function toDateTimeString(date) {
  const dateObj = parseDate(date);
  return formatISO9075(dateObj, { representation: 'complete' });
}

export function toDateString(date) {
  const dateObj = parseDate(date);
  return formatISO9075(dateObj, { representation: 'date' });
}

export function getCurrentDateTimeString() {
  return formatISO9075(new Date());
}

export function getCurrentDateString() {
  return formatISO9075(new Date(), { representation: 'date' });
}

export function convertISO9075toRFC3339(dateString) {
  return dateFnsFormat(new Date(dateString), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
}

export function ageInMonths(dob) {
  return differenceInMonths(new Date(), new Date(dob));
}

export function ageInYears(dob) {
  return differenceInYears(new Date(), new Date(dob));
}

// It seems that some JS implementations have problems
// parsing strings to dates.
export function parseISO9075(date) {
  return new Date(date.replace(' ', 'T'));
}

export function latestDateTime(...args) {
  const times = args.filter(x => x);
  times.sort(compareDesc);
  return times[0];
}

/*
 * date-fns wrappers
 * Wrapper functions around date-fns functions that parse date_string and date_time_string types
 * For date-fns docs @see https://date-fns.org
 */

export const format = (date, f) => {
  const dateObj = parseDate(date);
  return dateFnsFormat(dateObj, f);
};

export const differenceInMilliseconds = (a, b) =>
  dateFnsDifferenceInMilliseconds(new Date(a), new Date(b));
