import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import { parseDate } from '@tamanu/utils/dateTime';

type DateInput = string | Date | null | undefined;

const locale = globalThis.navigator?.language ?? 'default';

const intlFormatDate = (
  date: DateInput,
  formatOptions: Intl.DateTimeFormatOptions,
  fallback: string,
  countryTimeZone: string,
  timeZone?: string | null,
) => {
  if (!date) return fallback;
  const dateObj = timeZone ? fromZonedTime(date, countryTimeZone) : parseDate(date);
  if (!dateObj) return fallback;
  return dateObj.toLocaleString(locale, {
    ...formatOptions,
    timeZone: timeZone ?? countryTimeZone,
  } as Intl.DateTimeFormatOptions);
};

/** "12/04/20" */
export const formatShortest = (date: DateInput, countryTimeZone: string, timeZone?: string | null) =>
  intlFormatDate(date, { month: '2-digit', day: '2-digit', year: '2-digit' }, '--/--', countryTimeZone, timeZone);

/** "12/04/2020" */
export const formatShort = (date: DateInput, countryTimeZone: string, timeZone?: string | null) =>
  intlFormatDate(date, { day: '2-digit', month: '2-digit', year: 'numeric' }, '--/--/----', countryTimeZone, timeZone);

/** "12:30 am" */
export const formatTime = (date: DateInput, countryTimeZone: string, timeZone?: string | null) =>
  intlFormatDate(date, { timeStyle: 'short', hour12: true }, '__:__', countryTimeZone, timeZone);

/** "12:30:00 am" */
export const formatTimeWithSeconds = (date: DateInput, countryTimeZone: string, timeZone?: string | null) =>
  intlFormatDate(date, { timeStyle: 'medium', hour12: true }, '__:__:__', countryTimeZone, timeZone);

/** "3:30pm" - time without space */
export const formatTimeCompact = (date: DateInput, countryTimeZone: string, timeZone?: string | null) => {
  const result = intlFormatDate(date, { hour: 'numeric', minute: '2-digit', hour12: true }, 'Unknown', countryTimeZone, timeZone);
  return result.replace(' ', '').toLowerCase();
};

/** "3pm" - hour only, no minutes */
export const formatTimeSlot = (date: DateInput, countryTimeZone: string, timeZone?: string | null) => {
  const result = intlFormatDate(date, { hour: 'numeric', hour12: true }, 'Unknown', countryTimeZone, timeZone);
  return result.replace(' ', '').toLowerCase();
};

/** "Thursday, 14 July 2022, 03:44 pm" */
export const formatLong = (date: DateInput, countryTimeZone: string, timeZone?: string | null) =>
  intlFormatDate(date, { timeStyle: 'short', dateStyle: 'full', hour12: true }, 'Date information not available', countryTimeZone, timeZone);

/** "15 January 2024" */
export const formatFullDate = (date: DateInput, countryTimeZone: string, timeZone?: string | null) =>
  intlFormatDate(date, { day: 'numeric', month: 'long', year: 'numeric' }, 'Unknown', countryTimeZone, timeZone);

/** "Thu" */
export const formatWeekdayShort = (date: DateInput, countryTimeZone: string, timeZone?: string | null) =>
  intlFormatDate(date, { weekday: 'short' }, 'Unknown', countryTimeZone, timeZone);

/** "Thursday" */
export const formatWeekdayLong = (date: DateInput, countryTimeZone: string, timeZone?: string | null) =>
  intlFormatDate(date, { weekday: 'long' }, 'Unknown', countryTimeZone, timeZone);

/** "M" - single letter weekday */
export const formatWeekdayNarrow = (date: DateInput, countryTimeZone: string, timeZone?: string | null) =>
  intlFormatDate(date, { weekday: 'narrow' }, 'Unknown', countryTimeZone, timeZone);

/** "Apr 12, 2024" - medium date style with explicit month name */
export const formatShortExplicit = (date: DateInput, countryTimeZone: string, timeZone?: string | null) =>
  intlFormatDate(date, { dateStyle: 'medium' }, 'Unknown', countryTimeZone, timeZone);

/** "12 Apr 24" - short date with explicit month name */
export const formatShortestExplicit = (date: DateInput, countryTimeZone: string, timeZone?: string | null) =>
  intlFormatDate(date, { year: '2-digit', month: 'short', day: 'numeric' }, 'Unknown', countryTimeZone, timeZone);

/** "2024-01-15T14:30" - for HTML datetime-local input elements */
export const formatDateTimeLocal = (date: DateInput, countryTimeZone: string, timeZone?: string | null) => {
  if (date == null) return null;
  const dateObj = timeZone ? fromZonedTime(date, countryTimeZone) : parseDate(date);
  if (!dateObj) return null;
  return formatInTimeZone(dateObj, timeZone ?? countryTimeZone, "yyyy-MM-dd'T'HH:mm");
};
