import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { mapValues } from 'lodash';

import {
  toFacilityDateTime,
  toStoredDateTime,
  getCurrentDateStringInTimezone,
  getCurrentDateTimeStringInTimezone,
  getDayBoundaries,
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
  /** Get current date string in facility timezone */
  getCurrentDate: () => string;
  /** Get current datetime string in facility timezone */
  getCurrentDateTime: () => string;
  /** Get current facility wall-clock time as yyyy-MM-ddTHH:mm */
  getFacilityNow: () => string;
  /** Get day boundaries i.e start and end of the day at the given date in facility timezone for query */
  getDayBoundaries: (date: string) => { start: string; end: string } | null;
  /** Convert facility-tz input value to country-tz for storage */
  toStoredDateTime: (inputValue: string | null | undefined) => string | null;
  /** Convert stored country-tz value to facility-tz for display */
  toFacilityDateTime: (value: string | Date | null | undefined) => string | null;
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
      getCurrentDate: () => getCurrentDateStringInTimezone(facilityTimeZone ?? countryTimeZone),
      getCurrentDateTime: () => getCurrentDateTimeStringInTimezone(countryTimeZone),
      getFacilityNow: () =>
        toFacilityDateTime(
          getCurrentDateTimeStringInTimezone(countryTimeZone),
          countryTimeZone,
          facilityTimeZone,
        )!,
      getDayBoundaries: date => getDayBoundaries(date, countryTimeZone, facilityTimeZone),
      toStoredDateTime: value => toStoredDateTime(value, countryTimeZone, facilityTimeZone),
      toFacilityDateTime: value => toFacilityDateTime(value, countryTimeZone, facilityTimeZone),
    }),
    [countryTimeZone, facilityTimeZone, wrapFunction],
  );

  return React.createElement(DateTimeProviderContext.Provider, { value }, children);
};
