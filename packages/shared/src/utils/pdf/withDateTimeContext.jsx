import React, { createContext, useContext, useMemo } from 'react';
import { get, mapValues } from 'lodash';
import {
  formatShortest,
  formatShort,
  formatTime,
  formatTimeWithSeconds,
  formatLong,
  formatFullDate,
  formatInTz,
} from '@tamanu/utils/dateTime';

const formatters = {
  formatShortest,
  formatShort,
  formatTime,
  formatTimeWithSeconds,
  formatLong,
  formatFullDate,
};

const DateTimeContext = createContext(null);

export const useDateTimeFormat = () => {
  const context = useContext(DateTimeContext);
  if (!context) {
    throw new Error('useDateTimeFormat must be used within withDateTimeContext');
  }
  return context;
};

export const withDateTimeContext = Component => props => {
  const { settings, getSetting: getSettingProp } = props;
  const getSetting = getSettingProp ?? (key => get(settings, key));

  const countryTimeZone = getSetting('countryTimeZone');
  const timeZone = getSetting('timeZone');

  const value = useMemo(() => ({
    countryTimeZone,
    timeZone,
    formatCustom: (date, formatStr, fallback = 'N/A') => {
      if (!date) return fallback;
      return formatInTz(date, formatStr, countryTimeZone, timeZone) || fallback;
    },
    ...mapValues(formatters, fn => date => fn(date, countryTimeZone, timeZone)),
  }), [countryTimeZone, timeZone]);

  return (
    <DateTimeContext.Provider value={value}>
      <Component {...props} />
    </DateTimeContext.Provider>
  );
};
