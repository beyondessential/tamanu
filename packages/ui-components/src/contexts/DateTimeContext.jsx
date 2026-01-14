import React, { useCallback, useContext, useMemo } from 'react';
import {
  formatShortest as baseShortest,
  formatShort as baseShort,
  formatTime as baseTime,
  formatTimeWithSeconds as baseTimeWithSeconds,
  formatTimeCompact as baseTimeCompact,
  formatTimeSlot as baseTimeSlot,
  formatLong as baseLong,
  formatFullDate as baseFullDate,
  formatWeekdayShort as baseWeekdayShort,
  formatWeekdayLong as baseWeekdayLong,
  formatWeekdayNarrow as baseWeekdayNarrow,
  formatShortExplicit as baseShortExplicit,
  formatShortestExplicit as baseShortestExplicit,
  formatDateTimeLocal as baseDateTimeLocal,
} from '@tamanu/utils/dateTime';
import { useSettings } from './SettingsContext';

const DateTimeContext = React.createContext(null);

export const useDateTimeFormat = () => {
  const context = useContext(DateTimeContext);
  if (!context) {
    throw new Error('useDateTimeFormat must be used within a DateTimeProvider');
  }
  return context;
};

export const DateTimeProvider = ({ children, countryTimeZone = 'Pacific/Auckland' }) => {
  const { getSetting } = useSettings();
  const timeZone = getSetting('timeZone');

  const wrap = useCallback(
    fn => (date, skipTimezoneConversion) =>
      skipTimezoneConversion ? fn(date, countryTimeZone) : fn(date, countryTimeZone, timeZone),
    [countryTimeZone, timeZone],
  );

  const value = useMemo(
    () => ({
      timeZone,
      countryTimeZone,
      formatShortest: wrap(baseShortest),
      formatShort: wrap(baseShort),
      formatTime: wrap(baseTime),
      formatTimeWithSeconds: wrap(baseTimeWithSeconds),
      formatTimeCompact: wrap(baseTimeCompact),
      formatTimeSlot: wrap(baseTimeSlot),
      formatLong: wrap(baseLong),
      formatFullDate: wrap(baseFullDate),
      formatShortExplicit: wrap(baseShortExplicit),
      formatShortestExplicit: wrap(baseShortestExplicit),
      formatDateTimeLocal: wrap(baseDateTimeLocal),
      formatWeekdayShort: wrap(baseWeekdayShort),
      formatWeekdayLong: wrap(baseWeekdayLong),
      formatWeekdayNarrow: wrap(baseWeekdayNarrow),
    }),
    [timeZone, countryTimeZone, wrap],
  );

  return <DateTimeContext.Provider value={value}>{children}</DateTimeContext.Provider>;
};
