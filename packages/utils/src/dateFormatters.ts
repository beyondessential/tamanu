import { intlFormatDate } from './dateTime';

type DateInput = string | Date | null | undefined;

const createFormatter =
  (
    formatOptions: Intl.DateTimeFormatOptions,
    fallback: string,
    transform?: (result: string) => string,
  ) =>
  (date: DateInput, countryTimeZone: string, facilityTimeZone?: string | null): string => {
    const result = intlFormatDate(date, formatOptions, fallback, countryTimeZone, facilityTimeZone);
    return transform ? transform(result) : result;
  };

const compactTime = (s: string) => s.replace(' ', '').toLowerCase();

/** "12/04/24" */
export const formatShortest = createFormatter(
  { month: '2-digit', day: '2-digit', year: '2-digit' },
  '--/--',
);

/** "12/04/2020" */
export const formatShort = createFormatter(
  { day: '2-digit', month: '2-digit', year: 'numeric' },
  '--/--/----',
);

/** "12:30 am" */
export const formatTime = createFormatter({ timeStyle: 'short', hour12: true }, '__:__');

/** "12:30:00 am" */
export const formatTimeWithSeconds = createFormatter(
  { timeStyle: 'medium', hour12: true },
  '__:__:__',
);

/** "3pm" - hour only, no minutes or seconds */
export const formatTimeSlot = createFormatter({ hour: 'numeric', hour12: true }, '__', compactTime);

/** "3:30pm" - time with minutes, no space */
export const formatTimeCompact = createFormatter(
  { hour: 'numeric', minute: '2-digit', hour12: true },
  '__:__',
  compactTime,
);

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

/** "12/04/2024 12:30 am" */
export const formatShortDateTime = (
  date: DateInput,
  countryTimeZone: string,
  facilityTimeZone?: string | null,
) =>
  `${formatShort(date, countryTimeZone, facilityTimeZone)} ${formatTime(date, countryTimeZone, facilityTimeZone)}`;

/** "12/04/24 12:30 am" */
export const formatShortestDateTime = (
  date: DateInput,
  countryTimeZone: string,
  facilityTimeZone?: string | null,
) =>
  `${formatShortest(date, countryTimeZone, facilityTimeZone)} ${formatTime(date, countryTimeZone, facilityTimeZone)}`;
