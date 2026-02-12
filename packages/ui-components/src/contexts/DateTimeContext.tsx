import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { mapValues } from 'lodash';

import {
  toFacilityDateTime,
  toStoredDateTime,
  getCurrentDateStringInTimezone,
  getCurrentDateTimeStringInTimezone,
  getDayBoundaries,
  getFacilityNowDate,
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
  /** Get current date string in facility timezone */
  getCurrentDate: () => string;
  /** Get current datetime string in countryTimeZone (ISO 9075) */
  getCurrentDateTime: () => string;
  /** Get Date object in facility timezone */
  getFacilityNowDate: () => Date;
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

export const useDateTime = (): DateTimeContextValue => {
  const context = useContext(DateTimeProviderContext);
  if (!context) {
    throw new Error('useDateTime must be used within a DateTimeProvider');
  }
  return context;
};

// Temporary support patient portal
export const useDateTimeIfAvailable = (): DateTimeContextValue | null => {
  return useContext(DateTimeProviderContext);
};

const DateTimeProviderInner = ({
  children,
  countryTimeZone,
  facilityTimeZone,
}: {
  children: React.ReactNode;
  countryTimeZone: string;
  facilityTimeZone?: string | null;
}) => {
  const bindTimezones = useCallback(
    (fn: (...args: any[]) => any) => (date?: DateInput) =>
      fn(date, countryTimeZone, facilityTimeZone),
    [countryTimeZone, facilityTimeZone],
  );

  const value = useMemo(
    (): DateTimeContextValue => ({
      countryTimeZone,
      facilityTimeZone,
      ...(mapValues(dateTimeFormatters, bindTimezones) as WrappedFormatters),
      getCurrentDate: () => getCurrentDateStringInTimezone(facilityTimeZone ?? countryTimeZone),
      getCurrentDateTime: () => getCurrentDateTimeStringInTimezone(countryTimeZone),
      getFacilityNowDate: () => getFacilityNowDate(countryTimeZone, facilityTimeZone),
      getDayBoundaries: date => getDayBoundaries(date, countryTimeZone, facilityTimeZone),
      toStoredDateTime: value => toStoredDateTime(value, countryTimeZone, facilityTimeZone),
      toFacilityDateTime: value => toFacilityDateTime(value, countryTimeZone, facilityTimeZone),
    }),
    [countryTimeZone, facilityTimeZone, bindTimezones],
  );

  return React.createElement(DateTimeProviderContext.Provider, { value }, children);
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

  // Pre-login: countryTimeZone not yet available — render children without
  // the DateTime context. Post-login screens that call useDateTime() are
  // behind auth gates and will always have the context available.
  if (!countryTimeZone) {
    return <>{children}</>;
  }

  const facilityTimeZone = usePropsMode
    ? facilityTimeZoneProp
    : (getSetting('facilityTimeZone') as string | undefined);

  return (
    <DateTimeProviderInner
      countryTimeZone={countryTimeZone}
      facilityTimeZone={facilityTimeZone}
    >
      {children}
    </DateTimeProviderInner>
  );
};
