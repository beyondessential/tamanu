import { format, parseISO, differenceInCalendarYears } from 'date-fns';

/**
 * @param date Date
 * @param dateFormat string
 * @returns {string}
 */
export function formatDate(date, dateFormat) {
  return format(date, dateFormat);
}

/**
 * @param date Date
 * @returns {number}
 */
export function getAgeFromDate(date) {
  return differenceInCalendarYears(new Date(), new Date(date));
}

/**
 * @param date string
 * @param dateFormat string
 * @returns {string}
 */
export function formatStringDate(date, dateFormat) {
  const dateValue = parseISO(date);
  return formatDate(dateValue, dateFormat);
}
