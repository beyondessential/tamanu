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
  formatDateTimeLocal,
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

  const value = useMemo(
    (): DateTimeContextValue => ({
      countryTimeZone,
      facilityTimeZone,
      ...(mapValues(utils, wrapFunction) as WrappedUtils),
    }),
    [countryTimeZone, facilityTimeZone, wrapFunction],
  );

  return React.createElement(DateTimeProviderContext.Provider, { value }, children);
};
