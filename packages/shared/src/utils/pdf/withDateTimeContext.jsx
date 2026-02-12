import React, { createContext, useContext, useMemo } from 'react';
import { get, mapValues } from 'lodash';
import * as dateTimeFormatters from '@tamanu/utils/dateFormatters';

const DateTimeContext = createContext(null);

export const useDateTime = () => {
  const context = useContext(DateTimeContext);
  if (!context) {
    throw new Error('useDateTime must be used within withDateTimeContext');
  }
  return context;
};

export const withDateTimeContext = Component => props => {
  const { settings, getSetting: getSettingProp, primaryTimeZone } = props;
  const getSetting = getSettingProp ?? (key => get(settings, key));

  const facilityTimeZone = getSetting('facilityTimeZone');

  const value = useMemo(
    () => ({
      primaryTimeZone,
      facilityTimeZone,
      ...mapValues(dateTimeFormatters, fn => date => fn(date, primaryTimeZone, facilityTimeZone)),
    }),
    [primaryTimeZone, facilityTimeZone],
  );

  return (
    <DateTimeContext.Provider value={value}>
      <Component {...props} />
    </DateTimeContext.Provider>
  );
};
