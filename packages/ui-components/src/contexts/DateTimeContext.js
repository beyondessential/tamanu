import React, { useContext, useMemo } from 'react';
import {
  formatShortest as baseShortest,
  formatShort as baseShort,
  formatTime as baseTime,
  formatTimeWithSeconds as baseTimeWithSeconds,
  formatLong as baseLong,
  formatWeekdayShort as baseWeekdayShort,
  formatWeekdayLong as baseWeekdayLong,
  formatWeekdayNarrow as baseWeekdayNarrow,
  formatFullDate as baseFullDate,
  formatDayMonth as baseDayMonth,
  formatTimeSlot as baseTimeSlot,
  formatTimeCompact as baseTimeCompact,
  formatShortDateTime as baseShortDateTime,
  formatShortestDateTime as baseShortestDateTime,
  formatShortExplicit as baseShortExplicit,
  formatShortestExplicit as baseShortestExplicit,
  intlFormatDate as baseIntlFormatDate,
} from '@tamanu/utils/dateTime';
import { useSettings } from './SettingsContext';

const DateTimeContext = React.createContext(null);

export const useDateTimeFormat = () => useContext(DateTimeContext);

export const DateTimeProvider = ({ children, countryTimeZone = 'Pacific/Auckland' }) => {
  const { getSetting } = useSettings();
  const timeZone = getSetting('timeZone');

  const value = useMemo(
    () => ({
      formatShortest: date => baseShortest(date, countryTimeZone, timeZone),
      formatShort: date => baseShort(date, countryTimeZone, timeZone),
      formatTime: (date, options) => baseTime(date, countryTimeZone, timeZone, options),
      formatTimeWithSeconds: date => baseTimeWithSeconds(date, countryTimeZone, timeZone),
      formatLong: date => baseLong(date, countryTimeZone, timeZone),
      formatWeekdayShort: date => baseWeekdayShort(date, countryTimeZone, timeZone),
      formatWeekdayLong: date => baseWeekdayLong(date, countryTimeZone, timeZone),
      formatWeekdayNarrow: date => baseWeekdayNarrow(date, countryTimeZone, timeZone),
      formatFullDate: date => baseFullDate(date, countryTimeZone, timeZone),
      formatDayMonth: date => baseDayMonth(date, countryTimeZone, timeZone),
      formatTimeSlot: date => baseTimeSlot(date, countryTimeZone, timeZone),
      formatTimeCompact: date => baseTimeCompact(date, countryTimeZone, timeZone),
      formatShortDateTime: date => baseShortDateTime(date, countryTimeZone, timeZone),
      formatShortestDateTime: date => baseShortestDateTime(date, countryTimeZone, timeZone),
      formatShortExplicit: date => baseShortExplicit(date, countryTimeZone, timeZone),
      formatShortestExplicit: date => baseShortestExplicit(date, countryTimeZone, timeZone),
      intlFormatDate: (date, formatOptions, fallback = 'Unknown') =>
        baseIntlFormatDate(date, formatOptions, fallback, countryTimeZone, timeZone),
    }),
    [timeZone, countryTimeZone],
  );

  return <DateTimeContext.Provider value={value}>{children}</DateTimeContext.Provider>;
};

