import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { mapValues } from 'lodash';

import {
  formatForDateTimeInput as formatForDateTimeInputRaw,
  getCurrentDateStringInTimezone,
  getCurrentDateTimeStringInTimezone,
  getDayBoundaries,
  toDateTimeStringForPersistence as toDateTimeStringForPersistenceRaw,
} from '@tamanu/utils/dateTime';
import * as dateTimeFormatters from '@tamanu/utils/dateFormatters';

import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';

type DateInput = string | Date | null | undefined;

type WrappedFormatter = (date?: DateInput) => string | null;

type WrappedFormatters = {
  [K in keyof typeof dateTimeFormatters]: WrappedFormatter;
};

export interface DateTimeContextValue extends WrappedFormatters {
  countryTimeZone: string;
  facilityTimeZone?: string | null;
  /** Current date string for DateField defaults — facility's "today" */
  getCurrentDate: () => string;
  /** Current datetime string for DateTimeField defaults — stored in country tz for persistence */
  getCurrentDateTime: () => string;
  getDayBoundaries: (date: string) => { start: string; end: string } | null;
  toDateTimeStringForPersistence: (inputValue: string | null | undefined) => string | null;
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

  const bindTimezones = useCallback(
    (fn: (...args: any[]) => any) =>
      (date?: DateInput) =>
        fn(date, countryTimeZone, facilityTimeZone),
    [countryTimeZone, facilityTimeZone],
  );

  const value = useMemo(
    (): DateTimeContextValue => ({
      countryTimeZone,
      facilityTimeZone,
      ...(mapValues(dateTimeFormatters, bindTimezones) as WrappedFormatters),
      formatForDateTimeInput: bindTimezones(formatForDateTimeInputRaw),
      toDateTimeStringForPersistence: bindTimezones(toDateTimeStringForPersistenceRaw),
      getCurrentDate: () => getCurrentDateStringInTimezone(facilityTimeZone ?? countryTimeZone),
      getCurrentDateTime: () => getCurrentDateTimeStringInTimezone(countryTimeZone),
      getDayBoundaries: (date) => getDayBoundaries(date, countryTimeZone, facilityTimeZone),
    }),
    [countryTimeZone, facilityTimeZone, bindTimezones],
  );

  return React.createElement(DateTimeProviderContext.Provider, { value }, children);
};
