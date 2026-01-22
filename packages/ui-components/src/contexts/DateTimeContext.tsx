import React, { useCallback, useContext, useMemo, createContext } from 'react';
import { useSettings } from './SettingsContext';
import { mapValues } from 'lodash';
import {
  formatShortest,
  formatShort,
  formatTime,
  formatTimeWithSeconds,
  formatTimeCompact,
  formatTimeSlot,
  formatLong,
  formatFullDate,
  formatWeekdayShort,
  formatWeekdayLong,
  formatWeekdayNarrow,
  formatShortExplicit,
  formatShortestExplicit,
  formatDayMonth,
  formatDateTimeLocal,
  getCurrentDateTimeStringInTimezone,
  getCurrentDateStringInTimezone,
  toDateTimeStringForPersistence,
  formatForDateTimeInput,
} from '@tamanu/utils/dateTime';
import { useAuth } from './AuthContext';

const utils = {
  formatShortest,
  formatShort,
  formatTime,
  formatTimeWithSeconds,
  formatTimeCompact,
  formatTimeSlot,
  formatLong,
  formatFullDate,
  formatWeekdayShort,
  formatWeekdayLong,
  formatWeekdayNarrow,
  formatShortExplicit,
  formatShortestExplicit,
  formatDayMonth,
  formatDateTimeLocal,
};

type DateInput = string | Date | null | undefined;

type RawFormatter = (
  date?: DateInput,
  countryTimeZone?: string,
  facilityTimeZone?: string | null,
) => string | null;

type WrappedFormatter = (date?: DateInput) => string | null;

type WrappedUtils = {
  [K in keyof typeof utils]: WrappedFormatter;
};

export interface DateTimeContextValue extends WrappedUtils {
  countryTimeZone: string;
  facilityTimeZone?: string | null;
  /** Get current datetime string in display timezone (facility if set, otherwise country) */
  getCurrentDateTimeString: () => string;
  /** Get current date string in display timezone (facility if set, otherwise country) */
  getCurrentDateString: () => string;
  /** Convert datetime-local input value to country timezone for persistence */
  toDateTimeStringForPersistence: (inputValue: string | null | undefined) => string | null;
  /** Format stored value for datetime-local input display */
  formatForDateTimeInput: (value: string | Date | null | undefined) => string | null;
}

interface DateTimeProviderProps {
  children: React.ReactNode;
  countryTimeZone?: string;
  facilityTimeZone?: string | null;
}

const DateTimeProviderContext = createContext<DateTimeContextValue | null>(null);

export const useDateTimeFormat = (): DateTimeContextValue => {
  const context = useContext(DateTimeProviderContext);
  if (!context) {
    throw new Error('useDateTimeFormat must be used within a DateTimeProvider');
  }
  return context;
};

export const DateTimeProvider = ({
  children,
  countryTimeZone: countryTimeZoneProp,
  facilityTimeZone: facilityTimeZoneProp,
}: DateTimeProviderProps) => {
  const { countryTimeZone: authCountryTimeZone } = useAuth();
  const { getSetting } = useSettings();
  const usePropsMode = countryTimeZoneProp !== undefined;

  const countryTimeZone = usePropsMode ? countryTimeZoneProp : authCountryTimeZone;
  const facilityTimeZone = usePropsMode
    ? facilityTimeZoneProp
    : (getSetting('facilityTimeZone') as string | undefined);

  const wrapFunction = useCallback(
    (fn: RawFormatter) =>
      (date?: DateInput): string | Date | null =>
        fn(date, countryTimeZone, facilityTimeZone),
    [countryTimeZone, facilityTimeZone],
  );

  const displayTimezone = facilityTimeZone ?? countryTimeZone;

  const value = useMemo(
    (): DateTimeContextValue => ({
      countryTimeZone,
      facilityTimeZone,
      ...(mapValues(utils, wrapFunction) as WrappedUtils),
      getCurrentDateTimeString: () => getCurrentDateTimeStringInTimezone(displayTimezone),
      getCurrentDateString: () => getCurrentDateStringInTimezone(displayTimezone),
      toDateTimeStringForPersistence: (inputValue: string | null | undefined) =>
        toDateTimeStringForPersistence(inputValue, countryTimeZone, facilityTimeZone),
      formatForDateTimeInput: (value: string | Date | null | undefined) =>
        formatForDateTimeInput(value, countryTimeZone, facilityTimeZone),
    }),
    [countryTimeZone, facilityTimeZone, wrapFunction, displayTimezone],
  );

  return React.createElement(DateTimeProviderContext.Provider, { value }, children);
};
