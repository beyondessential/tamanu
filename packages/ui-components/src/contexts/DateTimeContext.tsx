import React, { useCallback, useContext, useMemo, ReactNode } from 'react';
import * as formatFunctions from './dateTimeFormatters';
import { SettingsContext } from './SettingsContext';
import { mapValues } from 'lodash';

type DateInput = string | Date | null | undefined;
type FormatFunction = (date: DateInput, skipTimezoneConversion?: boolean) => string | null;

type DateTimeContextValue = Record<string, FormatFunction>;

interface DateTimeProviderProps {
  children: ReactNode;
  countryTimeZone?: string;
  timeZone?: string;
}

const DateTimeProviderContext = React.createContext<DateTimeContextValue | null>(null);

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
    throw new Error('DateTimeProvider requires either a SettingsProvider ancestor or countryTimeZone prop');
  }

  const countryTimeZone = usePropsMode
    ? countryTimeZoneProp
    : (settingsContext?.getSetting('countryTimeZone') as string | undefined);
  const timeZone = usePropsMode
    ? timeZoneProp
    : (settingsContext?.getSetting('timeZone') as string | undefined);
  const isSettingsLoaded = usePropsMode || settingsContext?.isSettingsLoaded;

  const wrap = useCallback(
    (fn: (date: DateInput, countryTz: string, tz?: string | null) => string | null) =>
      (date: DateInput, skipTimezoneConversion = false) =>
        fn(date, countryTimeZone!, skipTimezoneConversion ? undefined : timeZone),
    [countryTimeZone, timeZone],
  );

  const value = useMemo(
    () =>
      (mapValues(formatFunctions, fn => wrap(fn))) as DateTimeContextValue,
    [wrap],
  );

  if (!isSettingsLoaded || !countryTimeZone) {
    return null;
  }

  return <DateTimeProviderContext.Provider value={value}>{children}</DateTimeProviderContext.Provider>;
};
