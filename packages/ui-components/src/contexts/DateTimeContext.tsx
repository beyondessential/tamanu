import React, { useCallback, useContext, useMemo, createContext } from 'react';
import { SettingsContext } from './SettingsContext';
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

type Formatters = {
  [K in keyof typeof formatters]: (date?: DateInput) => string | null;
};

export interface DateTimeContextValue extends Formatters {
  /** Display timezone - where the user is viewing from */
  facilityTimeZone: string | undefined;
  /** Source timezone - where data is stored (facility's country) */
  countryTimeZone: string;
}

interface DateTimeProviderProps {
  children: React.ReactNode;
  /** Global timezone - where data is stored. If provided, skips SettingsContext. */
  countryTimeZone?: string;
  /** Facility timezone - where data is stored (facility's country) */
  facilityTimeZone?: string;
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
  const settingsContext = useContext(SettingsContext);
  const usePropsMode = countryTimeZoneProp !== undefined;

  if (!usePropsMode && !settingsContext) {
    throw new Error(
      'DateTimeProvider requires either a SettingsProvider ancestor or countryTimeZone and facilityTimeZone props',
    );
  }

  const countryTimeZone = usePropsMode
    ? countryTimeZoneProp!
    : (settingsContext?.getSetting('countryTimeZone') as string);
  const facilityTimeZone = usePropsMode
    ? facilityTimeZoneProp
    : (settingsContext?.getSetting('facilityTimeZone') as string | undefined);
  const isSettingsLoaded = usePropsMode || settingsContext?.isSettingsLoaded;

  const wrapFormatter = useCallback(
    (fn: (date: DateInput, countryTz: string, tz?: string | null) => string | null) =>
      (date?: DateInput) => fn(date, countryTimeZone, facilityTimeZone),
    [countryTimeZone, facilityTimeZone],
  );

  const value = useMemo(
    (): DateTimeContextValue => ({
      countryTimeZone,
      facilityTimeZone,
      ...(mapValues(formatters, wrapFormatter) as Formatters),
    }),
    [countryTimeZone, facilityTimeZone, wrapFormatter],
  );

  if (!isSettingsLoaded || !countryTimeZone) {
    return null;
  }

  return React.createElement(DateTimeProviderContext.Provider, { value }, children);
};
