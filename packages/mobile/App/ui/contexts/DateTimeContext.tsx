import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { mapValues } from 'lodash';

import {
  formatForDateTimeInput,
  getCurrentDateStringInTimezone,
  getCurrentDateTimeStringInTimezone,
  toDateTimeStringForPersistence,
} from '@tamanu/utils/dateTime';
import * as dateTimeFormatters from '@tamanu/utils/dateFormatters';

import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';

type DateInput = string | Date | null | undefined;

type RawFormatter = (
  date?: DateInput,
  countryTimeZone?: string,
  facilityTimeZone?: string | null,
) => string | null;

type WrappedFormatter = (date?: DateInput) => string | null;

type WrappedFormatters = {
  [K in keyof typeof dateTimeFormatters]: WrappedFormatter;
};

export interface DateTimeContextValue extends WrappedFormatters {
  countryTimeZone: string;
  facilityTimeZone?: string | null;
  getCountryCurrentDateTimeString: () => string;
  getCountryCurrentDateString: () => string;
  getFacilityCurrentDateTimeString: () => string;
  getFacilityCurrentDateString: () => string;
  toDateTimeStringForPersistence: (inputValue: string | null | undefined) => string | null;
  formatForDateTimeInput: (value: string | Date | null | undefined) => string | null;
}

interface DateTimeProviderProps {
  children: React.ReactNode;
}

const DateTimeProviderContext = createContext<DateTimeContextValue | null>(null);

export const useDateTimeFormat = (): DateTimeContextValue => {
  const context = useContext(DateTimeProviderContext);
  if (!context) {
    throw new Error('useDateTimeFormat must be used within a DateTimeProvider');
  }
  return context;
};

export const DateTimeProvider = ({ children }: DateTimeProviderProps) => {
  const { countryTimeZone } = useAuth();
  const { getSetting } = useSettings();

  const facilityTimeZone = getSetting<string>('facilityTimeZone');

  const wrapFunction = useCallback(
    (fn: RawFormatter) =>
      (date?: DateInput): string | null =>
        fn(date, countryTimeZone, facilityTimeZone),
    [countryTimeZone, facilityTimeZone],
  );

  const value = useMemo(
    (): DateTimeContextValue => ({
      countryTimeZone,
      facilityTimeZone,
      ...(mapValues(dateTimeFormatters, wrapFunction) as WrappedFormatters),
      getCountryCurrentDateTimeString: () => getCurrentDateTimeStringInTimezone(countryTimeZone),
      getCountryCurrentDateString: () => getCurrentDateStringInTimezone(countryTimeZone),
      getFacilityCurrentDateTimeString: () =>
        getCurrentDateTimeStringInTimezone(facilityTimeZone ?? countryTimeZone),
      getFacilityCurrentDateString: () =>
        getCurrentDateStringInTimezone(facilityTimeZone ?? countryTimeZone),
      toDateTimeStringForPersistence: value =>
        toDateTimeStringForPersistence(value, countryTimeZone, facilityTimeZone),
      formatForDateTimeInput: value =>
        formatForDateTimeInput(value, countryTimeZone, facilityTimeZone),
    }),
    [countryTimeZone, facilityTimeZone, wrapFunction],
  );

  return React.createElement(DateTimeProviderContext.Provider, { value }, children);
};
