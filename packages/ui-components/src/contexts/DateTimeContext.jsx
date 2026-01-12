import React, { useContext, useMemo } from 'react';
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
  formatShortExplicit as baseShortExplicit,
  formatShortestExplicit as baseShortestExplicit,
  intlFormatDate as baseIntlFormatDate,
} from '@tamanu/utils/dateTime';
import { useSettings } from './SettingsContext';

const DateTimeContext = React.createContext({
  timeZone: null,
  countryTimeZone: 'Pacific/Auckland',
  formatShortest: () => null,
  formatShort: () => null,
  formatTime: () => null,
  formatTimeWithSeconds: () => null,
  formatTimeCompact: () => null,
  formatTimeSlot: () => null,
  formatLong: () => null,
  formatFullDate: () => null,
  formatWeekdayShort: () => null,
  formatShortExplicit: () => null,
  formatShortestExplicit: () => null,
  intlFormatDate: () => null,
});

export const useDateTimeFormat = () => useContext(DateTimeContext);

export const DateTimeProvider = ({ children, countryTimeZone = 'Pacific/Auckland' }) => {
  const { getSetting } = useSettings();
  const timeZone = getSetting('timeZone');
  const value = useMemo(
    () => ({
      timeZone,
      countryTimeZone,
      formatShortest: date => baseShortest(date, countryTimeZone, timeZone),
      formatShort: date => baseShort(date, countryTimeZone, timeZone),
      formatTime: (date, options) => baseTime(date, countryTimeZone, timeZone, options),
      formatTimeWithSeconds: date => baseTimeWithSeconds(date, countryTimeZone, timeZone),
      formatTimeCompact: date => baseTimeCompact(date, countryTimeZone, timeZone),
      formatTimeSlot: date => baseTimeSlot(date, countryTimeZone, timeZone),
      formatLong: date => baseLong(date, countryTimeZone, timeZone),
      formatFullDate: date => baseFullDate(date, countryTimeZone, timeZone),
      formatWeekdayShort: date => baseWeekdayShort(date, countryTimeZone, timeZone),
      formatShortExplicit: date => baseShortExplicit(date, countryTimeZone, timeZone),
      formatShortestExplicit: date => baseShortestExplicit(date, countryTimeZone, timeZone),
      intlFormatDate: (date, formatOptions, fallback = 'Unknown') =>
        baseIntlFormatDate(date, formatOptions, fallback, countryTimeZone, timeZone),
    }),
    [timeZone, countryTimeZone],
  );

  return <DateTimeContext.Provider value={value}>{children}</DateTimeContext.Provider>;
};

