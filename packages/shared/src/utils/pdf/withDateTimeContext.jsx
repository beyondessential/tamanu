import React, { createContext, useContext, useMemo } from 'react';
import { get, mapValues } from 'lodash';
import {
  formatShortest,
  formatShort,
  formatTime,
  formatTimeWithSeconds,
  formatTimeCompact,
  formatTimeSlot,
  formatLong,
  formatFullDate,
  formatShortExplicit,
  formatShortestExplicit,
  formatDayMonth,
  formatShortDateTime,
  formatShortestDateTime,
  formatWeekdayShort,
  formatWeekdayLong,
  formatWeekdayNarrow,
  formatInTz,
} from '@tamanu/utils/dateTime';

const formatters = {
  formatShortest,
  formatShort,
  formatTime,
  formatTimeWithSeconds,
  formatTimeCompact,
  formatTimeSlot,
  formatLong,
  formatFullDate,
  formatShortExplicit,
  formatShortestExplicit,
  formatDayMonth,
  formatShortDateTime,
  formatShortestDateTime,
  formatWeekdayShort,
  formatWeekdayLong,
  formatWeekdayNarrow,
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
  const facilityTimeZone = getSetting('facilityTimeZone');

  const value = useMemo(
    () => ({
      countryTimeZone,
      facilityTimeZone,
      formatCustom: (date, formatStr, fallback = 'N/A') => {
        if (!date) return fallback;
        return formatInTz(date, formatStr, countryTimeZone, facilityTimeZone) || fallback;
      },
      ...mapValues(formatters, fn => date => fn(date, countryTimeZone, facilityTimeZone)),
    }),
    [countryTimeZone, facilityTimeZone],
  );

  return (
    <DateTimeContext.Provider value={value}>
      <Component {...props} />
    </DateTimeContext.Provider>
  );
};
