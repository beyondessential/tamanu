import React, { createContext, useContext, useMemo } from 'react';
import { get, mapValues } from 'lodash';
import * as dateTimeFormatters from '@tamanu/utils/dateFormatters';
import {
  getCurrentDateStringInTimezone,
  getCurrentDateTimeStringInTimezone,
  locale as runtimeLocale,
} from '@tamanu/utils/dateTime';

const DateTimeContext = createContext(null);

export const useDateTime = () => {
  const context = useContext(DateTimeContext);
  if (!context) {
    throw new Error('useDateTime must be used within withDateTimeContext');
  }
  return context;
};

export const withDateTimeContext = Component => props => {
  const {
    settings,
    getSetting: getSettingProp,
    primaryTimeZone,
    dateTimeLocale: dateTimeLocaleProp,
  } = props;
  const getSetting = getSettingProp ?? (key => get(settings, key));

  const facilityTimeZone = getSetting('facilityTimeZone');
  const effectiveTimeZone = facilityTimeZone ?? primaryTimeZone;
  // The dateTimeLocale setting pins the deployment-wide formatting convention;
  // otherwise the dateTimeLocale prop carries the requesting browser's locale
  // (when rendered server-side in a request), falling back to the runtime default.
  const locale = getSetting('dateTimeLocale') ?? dateTimeLocaleProp;

  const value = useMemo(
    () => ({
      primaryTimeZone,
      facilityTimeZone,
      locale: locale ?? runtimeLocale,
      getCurrentDate: () => getCurrentDateStringInTimezone(effectiveTimeZone),
      getCurrentDateTime: () => getCurrentDateTimeStringInTimezone(primaryTimeZone),
      ...mapValues(
        dateTimeFormatters,
        fn => date => fn(date, primaryTimeZone, facilityTimeZone, locale ?? undefined),
      ),
    }),
    [primaryTimeZone, facilityTimeZone, effectiveTimeZone, locale],
  );

  return (
    <DateTimeContext.Provider value={value}>
      <Component {...props} />
    </DateTimeContext.Provider>
  );
};
