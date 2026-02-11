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

type WrappedFormatter = (date?: DateInput) => string | null;

type WrappedFormatters = {
  [K in keyof typeof dateTimeFormatters]: WrappedFormatter;
};

export interface DateTimeContextValue extends WrappedFormatters {
  globalTimeZone: string;
  facilityTimeZone?: string | null;
  /** Get current date string in facilityTimeZone */
  getCurrentDate: () => string;
  /** Get current datetime string in facilityTimeZone */
  getCurrentDateTime: () => string;
  /** Get current facility wall-clock time as yyyy-MM-ddTHH:mm */
  getFacilityNow: () => string;
  /** Get day boundaries i.e start and end of the day at the given date in facilityTimeZone for query */
  getDayBoundaries: (date: string) => { start: string; end: string } | null;
  /** Convert facilityTimeZone input value to globalTimeZone for storage */
  toStoredDateTime: (inputValue: string | null | undefined) => string | null;
  /** Convert stored globalTimeZone value to facilityTimeZone for display */
  toFacilityDateTime: (value: string | Date | null | undefined) => string | null;
}

interface DateTimeProviderProps {
  children: React.ReactNode;
  globalTimeZone?: string;
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

export const DateTimeProvider = ({
  children,
  globalTimeZone: globalTimeZoneProp,
  facilityTimeZone: facilityTimeZoneProp,
}: DateTimeProviderProps) => {
  const { globalTimeZone: authGlobalTimeZone } = useAuth();
  const { getSetting } = useSettings();
  const usePropsMode = globalTimeZoneProp !== undefined;

  const globalTimeZone = usePropsMode ? globalTimeZoneProp : authGlobalTimeZone;
  const facilityTimeZone = usePropsMode
    ? facilityTimeZoneProp
    : (getSetting('facilityTimeZone') as string | undefined);

  const bindTimeZones = useCallback(
    (fn: (...args: any[]) => any) =>
      (date?: DateInput) =>
        fn(date, globalTimeZone, facilityTimeZone),
    [globalTimeZone, facilityTimeZone],
  );

  const value = useMemo(
    (): DateTimeContextValue => ({
      globalTimeZone,
      facilityTimeZone,
      ...(mapValues(dateTimeFormatters, bindTimeZones) as WrappedFormatters),
      getCurrentDate: () => getCurrentDateStringInTimezone(facilityTimeZone ?? globalTimeZone),
      getCurrentDateTime: () => getCurrentDateTimeStringInTimezone(globalTimeZone),
      getFacilityNow: () =>
        toFacilityDateTime(
          getCurrentDateTimeStringInTimezone(globalTimeZone),
          globalTimeZone,
          facilityTimeZone,
        )!,
      getDayBoundaries: date => getDayBoundaries(date, globalTimeZone, facilityTimeZone),
      toStoredDateTime: value => toStoredDateTime(value, globalTimeZone, facilityTimeZone),
      toFacilityDateTime: value => toFacilityDateTime(value, globalTimeZone, facilityTimeZone),
    }),
    [globalTimeZone, facilityTimeZone, bindTimeZones],
  );

  return React.createElement(DateTimeProviderContext.Provider, { value }, children);
};
