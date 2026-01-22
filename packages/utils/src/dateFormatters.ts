import { intlFormatDate, parseDate} from './dateTime';
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import { format } from 'date-fns';

/** "12/04/24" */
export const formatShortest = (
    date: string | Date | null | undefined,
    countryTimeZone?: string,
    facilityTimeZone?: string | null,
  ) =>
    intlFormatDate(
      date,
      { month: '2-digit', day: '2-digit', year: '2-digit' },
      '--/--',
      countryTimeZone,
      facilityTimeZone,
    );
  
  /** "12/04/2020" */
  export const formatShort = (
    date: string | Date | null | undefined,
    countryTimeZone?: string,
    facilityTimeZone?: string | null,
  ) =>
    intlFormatDate(
      date,
      { day: '2-digit', month: '2-digit', year: 'numeric' },
      '--/--/----',
      countryTimeZone,
      facilityTimeZone,
    );
  
  /** "12:30 am" */
  export const formatTime = (
    date: string | Date | null | undefined,
    countryTimeZone?: string,
    facilityTimeZone?: string | null,
  ) =>
    intlFormatDate(
      date,
      {
        timeStyle: 'short',
        hour12: true,
      },
      '__:__',
      countryTimeZone,
      facilityTimeZone,
    );
  
  /** "12:30:00 am" */
  export const formatTimeWithSeconds = (
    date: string | Date | null | undefined,
    countryTimeZone?: string,
    facilityTimeZone?: string | null,
  ) =>
    intlFormatDate(
      date,
      {
        timeStyle: 'medium',
        hour12: true,
      },
      '__:__:__',
      countryTimeZone,
      facilityTimeZone,
    );
  
  /** "Thursday, 14 July 2022, 03:44 pm" */
  export const formatLong = (
    date: string | Date | null | undefined,
    countryTimeZone?: string,
    facilityTimeZone?: string | null,
  ) =>
    intlFormatDate(
      date,
      {
        timeStyle: 'short',
        dateStyle: 'full',
        hour12: true,
      },
      'Date information not available',
      countryTimeZone,
      facilityTimeZone,
    );
  
  /** "Thu" - 3 letter weekday abbreviation */
  export const formatWeekdayShort = (
    date: string | Date | null | undefined,
    countryTimeZone?: string,
    facilityTimeZone?: string | null,
  ) => intlFormatDate(date, { weekday: 'short' }, 'Unknown', countryTimeZone, facilityTimeZone);
  
  /** "Thursday" - full weekday name */
  export const formatWeekdayLong = (
    date: string | Date | null | undefined,
    countryTimeZone?: string,
    facilityTimeZone?: string | null,
  ) => intlFormatDate(date, { weekday: 'long' }, 'Unknown', countryTimeZone, facilityTimeZone);
  
  /** "M" - single letter weekday */
  export const formatWeekdayNarrow = (
    date: string | Date | null | undefined,
    countryTimeZone?: string,
    facilityTimeZone?: string | null,
  ) => intlFormatDate(date, { weekday: 'narrow' }, 'Unknown', countryTimeZone, facilityTimeZone);
  
  /** "15 January 2024" - date with full month and year */
  export const formatFullDate = (
    date: string | Date | null | undefined,
    countryTimeZone?: string,
    facilityTimeZone?: string | null,
  ) =>
    intlFormatDate(
      date,
      { day: 'numeric', month: 'long', year: 'numeric' },
      'Unknown',
      countryTimeZone,
      facilityTimeZone,
    );
  
  /** "3pm" - hour only, no minutes or seconds */
  export const formatTimeSlot = (
    date: string | Date | null | undefined,
    countryTimeZone?: string,
    facilityTimeZone?: string | null,
  ) => {
    const result = intlFormatDate(
      date,
      { hour: 'numeric', hour12: true },
      'Unknown',
      countryTimeZone,
      facilityTimeZone,
    );
    return result.replace(' ', '').toLowerCase();
  };
  
  /** "3:30pm" - time with minutes and seconds, no space */
  export const formatTimeCompact = (
    date: string | Date | null | undefined,
    countryTimeZone?: string,
    facilityTimeZone?: string | null,
  ) => {
    const result = intlFormatDate(
      date,
      { hour: 'numeric', minute: '2-digit', hour12: true },
      'Unknown',
      countryTimeZone,
      facilityTimeZone,
    );
    return result.replace(' ', '').toLowerCase();
  };
  
  /** "Jan 15, 2024" - medium date style with explicit month name (unambiguous across locales) */
  export const formatShortExplicit = (
    date: string | Date | null | undefined,
    countryTimeZone?: string,
    facilityTimeZone?: string | null,
  ) => intlFormatDate(date, { dateStyle: 'medium' }, 'Unknown', countryTimeZone, facilityTimeZone);
  
  /** "12 Apr 24" - short date with explicit month name (unambiguous across locales) */
  export const formatShortestExplicit = (
    date: string | Date | null | undefined,
    countryTimeZone?: string,
    facilityTimeZone?: string | null,
  ) =>
    intlFormatDate(
      date,
      { year: '2-digit', month: 'short', day: 'numeric' },
      'Unknown',
      countryTimeZone,
      facilityTimeZone,
    );
  
  /** "15 Mar" - day and short month name (no year) */
  export const formatDayMonth = (
    date: string | Date | null | undefined,
    countryTimeZone?: string,
    facilityTimeZone?: string | null,
  ) =>
    intlFormatDate(
      date,
      { month: 'short', day: 'numeric' },
      'Unknown',
      countryTimeZone,
      facilityTimeZone,
    );
  
  /** "12/04/2024 12:30 am" - short date with time */
  export const formatShortDateTime = (
    date: string | Date | null | undefined,
    countryTimeZone?: string,
    facilityTimeZone?: string | null,
  ) => {
    const dateStr = formatShort(date, countryTimeZone, facilityTimeZone);
    const timeStr = formatTime(date, countryTimeZone, facilityTimeZone);
    return `${dateStr} ${timeStr}`;
  };
  
  /** "12/04/24 12:30 am" - shortest date with time */
  export const formatShortestDateTime = (
    date: string | Date | null | undefined,
    countryTimeZone?: string,
    facilityTimeZone?: string | null,
  ) => {
    const dateStr = formatShortest(date, countryTimeZone, facilityTimeZone);
    const timeStr = formatTime(date, countryTimeZone, facilityTimeZone);
    return `${dateStr} ${timeStr}`;
  };
  
  /** "2024-01-15T14:30" - for HTML datetime-local input elements */
  export const formatDateTimeLocal = (
    date: string | Date | null | undefined,
    countryTimeZone?: string,
    facilityTimeZone?: string | null,
  ) => {
    if (date == null) return null;
    const tz = facilityTimeZone ?? countryTimeZone;
    const dateObj =
      facilityTimeZone && countryTimeZone ? fromZonedTime(date, countryTimeZone) : parseDate(date);
    if (!dateObj) return null;
    if (!tz) return format(dateObj, "yyyy-MM-dd'T'HH:mm");
    return formatInTimeZone(dateObj, tz, "yyyy-MM-dd'T'HH:mm");
  };
