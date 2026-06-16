import { Temporal } from 'temporal-polyfill';

import { intlFormatDate, locale, parseSurveyTimeToHHmmss, type DateInput } from './dateTime.ts';

const createFormatter =
  (
    formatOptions: Intl.DateTimeFormatOptions,
    fallback: string,
    transform?: (result: string) => string,
  ) =>
  (
    date: DateInput,
    primaryTimeZone: string,
    facilityTimeZone?: string | null,
    locale?: string,
  ): string => {
    const result = intlFormatDate(
      date,
      formatOptions,
      fallback,
      primaryTimeZone,
      facilityTimeZone,
      locale,
    );
    return transform ? transform(result) : result;
  };

const compactTime = (s: string) => s.replace(' ', '').toLowerCase();

/** "12/04/24" */
export const formatShortest = createFormatter(
  { month: '2-digit', day: '2-digit', year: '2-digit' },
  '‒‒/‒‒', // Figure dashes U+2012
);

/** "12/04/2020" */
export const formatShort = createFormatter(
  { day: '2-digit', month: '2-digit', year: 'numeric' },
  '‒‒/‒‒/‒‒‒‒', // Figure dashes U+2012
);

/** "12:30am" */
export const formatTime = createFormatter(
  { hour12: true, timeStyle: 'short' },
  '‒‒:‒‒',
  compactTime,
);

/**
 * @param time - Plain time without a date or time zone, in HH:mm or HH:mm:ss format
 * @returns Wall-clock time in 12-hour format, no seconds component (hh:mma).
 * @example "2:30pm"
 * */
export const formatPlainTime = (time: string | null | undefined): string => {
  if (!time) return '‒‒:‒‒';
  const HHmmss = parseSurveyTimeToHHmmss(time);
  if (!HHmmss) return '‒‒:‒‒';
  try {
    return compactTime(
      Temporal.PlainTime.from(HHmmss).toLocaleString(locale, { hour12: true, timeStyle: 'short' }),
    );
  } catch {
    return '‒‒:‒‒';
  }
};

/** "12:30:00am" */
export const formatTimeWithSeconds = createFormatter(
  { timeStyle: 'medium', hour12: true },
  '__:__:__',
  compactTime,
);

/** "3pm" - hour only, no minutes or seconds */
export const formatTimeSlot = createFormatter({ hour: 'numeric', hour12: true }, '__', compactTime);

/** "Thu" */
export const formatWeekdayShort = createFormatter({ weekday: 'short' }, 'Unknown');

/** "Thursday" */
export const formatWeekdayLong = createFormatter({ weekday: 'long' }, 'Unknown');

/** "M" */
export const formatWeekdayNarrow = createFormatter({ weekday: 'narrow' }, 'Unknown');

/** "15 January 2024" */
export const formatFullDate = createFormatter(
  { day: 'numeric', month: 'long', year: 'numeric' },
  'Unknown',
);

/** "Jan 15, 2024" */
export const formatShortExplicit = createFormatter({ dateStyle: 'medium' }, 'Unknown');

/** "12 Apr 24" */
export const formatShortestExplicit = createFormatter(
  { year: '2-digit', month: 'short', day: 'numeric' },
  'Unknown',
);

/** "15 Mar" */
export const formatDayMonth = createFormatter({ month: 'short', day: 'numeric' }, 'Unknown');

/** "12/04/2024 12:30am" */
export const formatShortDateTime = (
  date: DateInput,
  primaryTimeZone: string,
  facilityTimeZone?: string | null,
  locale?: string,
) =>
  `${formatShort(date, primaryTimeZone, facilityTimeZone, locale)} ${formatTime(date, primaryTimeZone, facilityTimeZone, locale)}`;

/** "12/04/24 12:30am" */
export const formatShortestDateTime = (
  date: DateInput,
  primaryTimeZone: string,
  facilityTimeZone?: string | null,
  locale?: string,
) =>
  `${formatShortest(date, primaryTimeZone, facilityTimeZone, locale)} ${formatTime(date, primaryTimeZone, facilityTimeZone, locale)}`;
