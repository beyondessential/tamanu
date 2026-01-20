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

const formatters = {
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

type WrappedFormatters = {
  [K in keyof typeof formatters]: (date?: DateInput) => string | null;
};

export interface DateTimeContextValue extends WrappedFormatters {
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

  const wrapFormatter = useCallback(
    (fn: RawFormatter) =>
      (date?: DateInput): string | null =>
        fn(date, countryTimeZone, facilityTimeZone),
    [countryTimeZone, facilityTimeZone],
  );

  const value = useMemo(
    (): DateTimeContextValue => ({
      countryTimeZone,
      facilityTimeZone,
      ...(mapValues(formatters, wrapFormatter) as WrappedFormatters),
    }),
    [countryTimeZone, facilityTimeZone, wrapFormatter],
  );

  if (!countryTimeZone) {
    return null;
  }

  return React.createElement(DateTimeProviderContext.Provider, { value }, children);
};
