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

/**
 * Timezone terminology:
 * - countryTimeZone (source): Where data is stored/recorded (e.g., facility's country)
 * - timeZone (display): Where user is viewing from (may differ for remote users)
 *
 * When timeZone differs from countryTimeZone, datetimes are converted for display.
 * Date-only values (e.g., DOB) are never converted.
 */

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
  timeZone: string | undefined;
  /** Source timezone - where data is stored (facility's country) */
  countryTimeZone: string;
}

interface DateTimeProviderProps {
  children: React.ReactNode;
  /** Source timezone - where data is stored. If provided, skips SettingsContext. */
  countryTimeZone?: string;
  /** Facility timezone - where data is stored (facility's country) */
  timeZone?: string;
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
  timeZone: timeZoneProp,
}: DateTimeProviderProps) => {
  const settingsContext = useContext(SettingsContext);
  const usePropsMode = countryTimeZoneProp !== undefined;

  if (!usePropsMode && !settingsContext) {
    throw new Error(
      'DateTimeProvider requires either a SettingsProvider ancestor or countryTimeZone prop',
    );
  }

  const countryTimeZone = usePropsMode
    ? countryTimeZoneProp!
    : (settingsContext?.getSetting('countryTimeZone') as string);
  const timeZone = usePropsMode
    ? timeZoneProp
    : (settingsContext?.getSetting('timeZone') as string | undefined);
  const isSettingsLoaded = usePropsMode || settingsContext?.isSettingsLoaded;

  const wrapFormatter = useCallback(
    (fn: (date: DateInput, countryTz: string, tz?: string | null) => string | null) =>
      (date?: DateInput) => fn(date, countryTimeZone, timeZone),
    [countryTimeZone, timeZone],
  );

  const value = useMemo(
    (): DateTimeContextValue => ({
      countryTimeZone,
      timeZone,
      ...(mapValues(formatters, wrapFormatter) as Formatters),
    }),
    [countryTimeZone, timeZone, wrapFormatter],
  );

  if (!isSettingsLoaded || !countryTimeZone) {
    return null;
  }

  return React.createElement(DateTimeProviderContext.Provider, { value }, children);
};
