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
  intlFormatDate as baseIntlFormatDate,
  formatDateOnlyShort as baseDateOnlyShort,
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
  formatShortExplicit: () => null,
  formatShortestExplicit: () => null,
  formatWeekdayShort: () => null,
  formatWeekdayLong: () => null,
  formatWeekdayNarrow: () => null,
  formatDateOnlyShort: () => null,
  intlFormatDate: () => null,
});

export const useDateTimeFormat = () => useContext(DateTimeContext);


export const DateTimeProvider = ({ children, countryTimeZone = 'Pacific/Auckland' }) => {
  const { getSetting } = useSettings();
  const timeZone = getSetting('timeZone');
  
  const getDateFormatter = useCallback(
    (formatFunc) => (date, isDateOnly) => {
      if (isDateOnly) {
        return formatFunc(date);
      }
      return formatFunc(date, countryTimeZone, timeZone);
    },
    [countryTimeZone, timeZone],
  );

  const value = useMemo(
    () => ({
      timeZone,
      countryTimeZone,
      formatShortest: getDateFormatter(baseShortest),
      formatShort: getDateFormatter(baseShort),
      formatTime: getDateFormatter(baseTime),
      formatTimeWithSeconds: getDateFormatter(baseTimeWithSeconds),
      formatTimeCompact: getDateFormatter(baseTimeCompact),
      formatTimeSlot: getDateFormatter(baseTimeSlot),
      formatLong: getDateFormatter(baseLong),
      formatFullDate: getDateFormatter(baseFullDate),
      formatShortExplicit: getDateFormatter(baseShortExplicit),
      formatShortestExplicit: getDateFormatter(baseShortestExplicit),
      // No timezone conversion needed for these
      formatWeekdayShort: getDateFormatter(baseWeekdayShort),
      formatWeekdayLong: getDateFormatter(baseWeekdayLong),
      formatWeekdayNarrow: getDateFormatter(baseWeekdayNarrow),
      formatDateOnlyShort: getDateFormatter(baseDateOnlyShort),
      intlFormatDate: getDateFormatter(baseIntlFormatDate),
    }),
    [timeZone, countryTimeZone, getDateFormatter],
  );

  return <DateTimeContext.Provider value={value}>{children}</DateTimeContext.Provider>;
};

