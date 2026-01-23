import React, { createContext, useContext, useMemo } from 'react';
import { get, mapValues } from 'lodash';
import * as dateTimeFormatters from '@tamanu/utils/dateFormatters';

const DateTimeContext = createContext(null);

export const useDateTimeFormat = () => {
  const context = useContext(DateTimeContext);
  if (!context) {
    throw new Error('useDateTimeFormat must be used within withDateTimeContext');
  }
  return context;
};

export const withDateTimeContext = Component => props => {
  const { settings, getSetting: getSettingProp, countryTimeZone: countryTimeZoneProp } = props;
  const getSetting = getSettingProp ?? (key => get(settings, key));

  const countryTimeZone = countryTimeZoneProp ?? getSetting('countryTimeZone');
  const facilityTimeZone = getSetting('facilityTimeZone');

  const value = useMemo(
    () => ({
      countryTimeZone,
      facilityTimeZone,
      ...mapValues(dateTimeFormatters, fn => date => fn(date, countryTimeZone, facilityTimeZone)),
    }),
    [countryTimeZone, facilityTimeZone],
  );

  return (
    <DateTimeContext.Provider value={value}>
      <Component {...props} />
    </DateTimeContext.Provider>
  );
};
