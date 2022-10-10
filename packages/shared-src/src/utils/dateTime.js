import {
  isValid,
  formatISO9075,
  differenceInMonths,
  differenceInYears,
  compareDesc,
  format as dateFnsFormat,
  differenceInMilliseconds as dateFnsDifferenceInMilliseconds,
} from 'date-fns';

export function toDateTimeString(date) {
  if (date === null || date === undefined) return null;

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(dateObj)) throw new Error('Not a valid date');

  return formatISO9075(dateObj, { representation: 'complete' });
}

export function toDateString(date) {
  if (date === null || date === undefined) return null;

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(dateObj)) throw new Error('Not a valid date');

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

// It seems that some JS implementations have problems
// parsing strings to dates.
export const format = (date, f) => {
  const dateObj = typeof date === 'string' ? new Date(date.replace(' ', 'T')) : date;
  return dateFnsFormat(dateObj, f);
};

export const differenceInMilliseconds = (a, b) =>
  dateFnsDifferenceInMilliseconds(new Date(a), new Date(b));
