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

type DateInput = string | Date | null | undefined;
type FormatFunction = (date: DateInput) => string | null;

interface DateTimeContextValue {
  countryTimeZone: string;
  formatShortest: FormatFunction;
  formatShort: FormatFunction;
  formatTime: FormatFunction;
  formatTimeWithSeconds: FormatFunction;
  formatTimeCompact: FormatFunction;
  formatTimeSlot: FormatFunction;
  formatLong: FormatFunction;
  formatFullDate: FormatFunction;
  formatShortExplicit: FormatFunction;
  formatShortestExplicit: FormatFunction;
  formatWeekdayShort: FormatFunction;
  formatWeekdayLong: FormatFunction;
  formatWeekdayNarrow: FormatFunction;
  formatDateTimeLocal: FormatFunction;
}

const DateTimeContext = React.createContext<DateTimeContextValue | null>(null);

export const useDateTimeFormat = () => {
  const context = useContext(DateTimeContext);
  if (!context) {
    throw new Error('useDateTimeFormat must be used within a DateTimeProvider');
  }
  return context;
};

interface DateTimeProviderProps {
  children: React.ReactNode;
  countryTimeZone: string;
}

export const DateTimeProvider = ({ children, countryTimeZone }: DateTimeProviderProps) => {
  const wrap = useCallback(
    <T extends (date: DateInput, tz: string, tz2?: string | null) => string | null>(fn: T) =>
      (date: DateInput) =>  fn(date, countryTimeZone),
    [countryTimeZone],
  );

  const value = useMemo(
    () => ({
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
    [countryTimeZone, wrap],
  );

  return <DateTimeContext.Provider value={value}>{children}</DateTimeContext.Provider>;
};
