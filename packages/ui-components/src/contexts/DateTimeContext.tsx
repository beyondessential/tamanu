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
  /** Get current datetime string in country timezone (for initial values / persistence) */
  getCurrentDateTimeString: () => string;
  /** Get current date string in country timezone (for initial values / persistence) */
  getCurrentDateString: () => string;
  // /** Get current datetime string in facility timezone (for UI display of "now") */
  // getFacilityCurrentDateTimeString: () => string;
  // /** Get current date string in facility timezone (for UI display of "now") */
  // getFacilityCurrentDateString: () => string;
  /** Convert datetime-local input value (facility TZ) to country timezone for persistence */
  toDateTimeStringForPersistence: (inputValue: string | null | undefined) => string | null;
  /** Format stored value (country TZ) for datetime-local input display (facility TZ) */
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

  const value = useMemo(
    (): DateTimeContextValue => ({
      countryTimeZone,
      facilityTimeZone,
      ...(mapValues(dateTimeFormatters, wrapFunction) as WrappedFormatters),
      getCurrentDateTimeString: () => getCurrentDateTimeStringInTimezone(countryTimeZone),
      getCurrentDateString: () => getCurrentDateStringInTimezone(countryTimeZone),
      toDateTimeStringForPersistence: value =>
        toDateTimeStringForPersistence(value, countryTimeZone, facilityTimeZone),
      formatForDateTimeInput: value =>
        formatForDateTimeInput(value, countryTimeZone, facilityTimeZone),
    }),
    [countryTimeZone, facilityTimeZone, wrapFunction],
  );

  return React.createElement(DateTimeProviderContext.Provider, { value }, children);
};
