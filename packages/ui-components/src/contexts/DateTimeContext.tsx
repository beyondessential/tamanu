import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { mapValues } from 'lodash';

import {
  toFacilityDateTime,
  toStoredDateTime,
  getCurrentDateStringInTimezone,
  getCurrentDateTimeStringInTimezone,
  getDayBoundaries,
  getFacilityNowDate,
  type DateInput,
} from '@tamanu/utils/dateTime';
import * as dateTimeFormatters from '@tamanu/utils/dateFormatters';

import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';

type WrappedFormatter = (date?: DateInput) => string | null;

type WrappedFormatters = {
  [K in keyof typeof dateTimeFormatters]: WrappedFormatter;
};

export interface DateTimeContextValue extends WrappedFormatters {
  primaryTimeZone: string;
  facilityTimeZone?: string | null;
  /** Get current date string in facilityTimeZone */
  getCurrentDate: () => string;
  /** Get current datetime string in primaryTimeZone (ISO 9075) */
  getCurrentDateTime: () => string;
  /** Get Date object in facility timezone */
  getFacilityNowDate: () => Date;
  /** Get day boundaries i.e start and end of the day at the given date in facility timezone for query */
  getDayBoundaries: (date: string) => { start: string; end: string } | null;
  /** Convert facilityTimeZone input value to primaryTimeZone for storage */
  toStoredDateTime: (inputValue: string | null | undefined) => string | null;
  /** Convert stored primaryTimeZone value to facilityTimeZone for display */
  toFacilityDateTime: (value: string | Date | null | undefined) => string | null;
}

interface DateTimeProviderProps {
  children: React.ReactNode;
  primaryTimeZone?: string;
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
  primaryTimeZone,
  facilityTimeZone,
}: {
  children: React.ReactNode;
  primaryTimeZone: string;
  facilityTimeZone?: string | null;
}) => {
  const bindTimeZones = useCallback(
    (fn: (...args: any[]) => any) => (date?: DateInput) =>
      fn(date, primaryTimeZone, facilityTimeZone),
    [primaryTimeZone, facilityTimeZone],
  );

  const value = useMemo(
    (): DateTimeContextValue => ({
      primaryTimeZone,
      facilityTimeZone,
      ...(mapValues(dateTimeFormatters, bindTimeZones) as WrappedFormatters),
      getCurrentDate: () => getCurrentDateStringInTimezone(facilityTimeZone ?? primaryTimeZone),
      getCurrentDateTime: () => getCurrentDateTimeStringInTimezone(primaryTimeZone),
      getFacilityNowDate: () => getFacilityNowDate(primaryTimeZone, facilityTimeZone),
      getDayBoundaries: date => getDayBoundaries(date, primaryTimeZone, facilityTimeZone),
      toStoredDateTime: value => toStoredDateTime(value, primaryTimeZone, facilityTimeZone),
      toFacilityDateTime: value => toFacilityDateTime(value, primaryTimeZone, facilityTimeZone),
    }),
    [primaryTimeZone, facilityTimeZone, bindTimeZones],
  );

  return React.createElement(DateTimeProviderContext.Provider, { value }, children);
};

export const DateTimeProvider = ({
  children,
  primaryTimeZone: primaryTimeZoneProp,
  facilityTimeZone: facilityTimeZoneProp,
}: DateTimeProviderProps) => {
  const { primaryTimeZone: authPrimaryTimeZone } = useAuth();
  const { getSetting } = useSettings();
  const usePropsMode = primaryTimeZoneProp !== undefined;

  const primaryTimeZone = usePropsMode ? primaryTimeZoneProp : authPrimaryTimeZone;

  // Pre-login: primaryTimeZone not yet available — render children without
  // the DateTime context. Post-login screens that call useDateTime() are
  // behind auth gates and will always have the context available.
  if (!primaryTimeZone) {
    return <>{children}</>;
  }

  const facilityTimeZone = usePropsMode
    ? facilityTimeZoneProp
    : (getSetting('facilityTimeZone') as string | undefined);

  return (
    <DateTimeProviderInner
      primaryTimeZone={primaryTimeZone}
      facilityTimeZone={facilityTimeZone}
    >
      {children}
    </DateTimeProviderInner>
  );
};
