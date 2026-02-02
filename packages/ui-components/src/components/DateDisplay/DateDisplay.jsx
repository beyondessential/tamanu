import React, { useState } from 'react';
import { isSameDay } from 'date-fns';
import { Box, Typography } from '@material-ui/core';
import styled from 'styled-components';
import {
  parseDate,
  isISO9075DateString,
} from '@tamanu/utils/dateTime';

import { TAMANU_COLORS } from '../../constants';
import { ThemedTooltip } from '../Tooltip';
import { useDateTimeFormat } from '../../contexts';
import { DiagnosticInfo } from './DiagnosticInfo';

const Text = styled(Typography)`
  font-size: inherit;
  line-height: inherit;
  margin-top: -2px;
`;

const SoftText = styled(Text)`
  color: ${TAMANU_COLORS.midText};
`;

const DateTooltip = ({
  rawDate,
  displayDate,
  timeOnlyTooltip,
  facilityTimeZone,
  countryTimeZone,
  children,
}) => {
  const isDateOnly = typeof rawDate === 'string' && isISO9075DateString(rawDate);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [debug, setDebug] = useState(false);

  const handleOpen = event => {
    if (event.shiftKey) {
      setDebug(true);
    }
    setTooltipOpen(true);
  };

  const handleClose = () => {
    setTooltipOpen(false);
    setDebug(false);
  };

  const dateTooltip = timeOnlyTooltip ? (
    <TimeDisplay date={rawDate} noTooltip />
  ) : (
    <DateDisplay date={rawDate} timeFormat={!isDateOnly ? 'default' : null} noTooltip />
  );

  const tooltipTitle = debug ? (
    <DiagnosticInfo
      rawDate={rawDate}
      displayDate={displayDate}
      countryTimeZone={countryTimeZone}
      facilityTimeZone={facilityTimeZone}
    />
  ) : (
    dateTooltip
  );

  return (
    <ThemedTooltip
      open={tooltipOpen}
      onClose={handleClose}
      onOpen={handleOpen}
      title={tooltipTitle}
    >
      {children}
    </ThemedTooltip>
  );
};

const DATE_FORMATS = {
  short: 'formatShort',
  shortest: 'formatShortest',
  long: 'formatFullDate',
  explicit: 'formatShortExplicit',
  explicitShort: 'formatShortestExplicit',
  dayMonth: 'formatDayMonth',
};

const TIME_FORMATS = {
  default: 'formatTime',
  compact: 'formatTimeCompact',
  withSeconds: 'formatTimeWithSeconds',
  slot: 'formatTimeSlot',
};

const WEEKDAY_FORMATS = {
  short: 'formatWeekdayShort',
  long: 'formatWeekdayLong',
  narrow: 'formatWeekdayNarrow',
};

const useFormattedDate = (dateValue, { dateFormat, timeFormat, weekdayFormat }) => {
  const formatters = useDateTimeFormat();
  const parts = [];

  if (weekdayFormat) {
    const formatterName = WEEKDAY_FORMATS[weekdayFormat] || WEEKDAY_FORMATS.short;
    parts.push(formatters[formatterName](dateValue));
  }

  if (dateFormat) {
    const formatterName = DATE_FORMATS[dateFormat] || DATE_FORMATS.short;
    parts.push(formatters[formatterName](dateValue));
  }

  if (timeFormat) {
    const formatterName = TIME_FORMATS[timeFormat] || TIME_FORMATS.default;
    parts.push(formatters[formatterName](dateValue));
  }

  return parts.join(' ');
};

/**
 * TimeDisplay - Displays time only
 * @param {string|Date} date - The date/time value
 * @param {string} format - "default" | "compact" | "withSeconds" | "slot"
 * @param {boolean} noTooltip - Disable hover tooltip
 *
 * @example
 * // format="default" → "9:30 am"
 * <TimeDisplay date="2024-03-15 09:30:00" />
 *
 * // format="compact" → "9:30am" (time with minutes, no space)
 * <TimeDisplay date="2024-03-15 09:30:00" format="compact" />
 *
 * // format="withSeconds" → "9:30:45 am"
 * <TimeDisplay date="2024-03-15 09:30:45" format="withSeconds" />
 *
 * // format="slot" → "9am" (hour only, for calendar slots)
 * <TimeDisplay date="2024-03-15 09:30:00" format="slot" />
 */
export const TimeDisplay = React.memo(
  ({ date: dateValue, format: timeFormat = 'default', noTooltip = false, style, ...props }) => {
    const { countryTimeZone, facilityTimeZone } = useDateTimeFormat();
    const displayTime = useFormattedDate(dateValue, { timeFormat });

    const content = (
      <span style={style} {...props}>
        {displayTime}
      </span>
    );

    if (noTooltip) return content;

    return (
      <DateTooltip
        rawDate={dateValue}
        displayDate={displayTime}
        timeOnlyTooltip
        facilityTimeZone={facilityTimeZone}
        countryTimeZone={countryTimeZone}
      >
        {content}
      </DateTooltip>
    );
  },
);

/**
 * DateDisplay - Displays date with optional time (applies timezone conversion)
 * Note: If weekdayFormat and timeFormat are provided display will follow format "{weekdayFormat} {format} {timeFormat}"
 * @param {string} format - "short" (default) | "shortest" | "long" | "explicit" | "explicitShort" | "dayMonth" | null (for weekday/time only)
 * @param {string} weekdayFormat - "short" (e.g. "Fri") | "long" (e.g. "Friday") | "narrow" (e.g. "F") | null (default, hides weekday)
 * @param {string} timeFormat - "default" (e.g. "9:30 am") | "compact" (e.g. "9:30am") | "withSeconds" (e.g. "9:30:45 am") | "slot" (e.g. "9am") | null (default, hides time)
 * @param {boolean} noTooltip - Disable hover tooltip
 *
 * @example
 * // format="short" (default) → "15/03/2024"
 * <DateDisplay date="2024-03-15 09:30:00" />
 *
 * // format="shortest" → "15/03/24"
 * <DateDisplay date="2024-03-15 09:30:00" format="shortest" />
 *
 * // format="long" → "15 March 2024"
 * <DateDisplay date="2024-03-15 09:30:00" format="long" />
 *
 * // format="explicit" → "Mar 15, 2024"
 * <DateDisplay date="2024-03-15 09:30:00" format="explicit" />
 *
 * // format="explicitShort" → "15 Mar 24"
 * <DateDisplay date="2024-03-15 09:30:00" format="explicitShort" />
 * 
 * // format="dayMonth" → "15 Mar"
 * <DateDisplay date="2024-03-15 09:30:00" format="dayMonth" />
 *
 * // weekdayFormat="short" → "Fri 15/03/2024"
 * <DateDisplay date="2024-03-15 09:30:00" weekdayFormat="short" />
 *
 * // weekdayFormat="long" → "Friday 15/03/2024"
 * <DateDisplay date="2024-03-15 09:30:00" weekdayFormat="long" />
 *
 * // timeFormat="default" → "15/03/2024 9:30 am"
 * <DateDisplay date="2024-03-15 09:30:00" timeFormat="default" />
 *
 * // Combined → "Fri 15/03/2024 9:30 am"
 * <DateDisplay date="2024-03-15 09:30:00" weekdayFormat="short" timeFormat="default" />
 */
export const DateDisplay = React.memo(
  ({
    date: dateValue,
    format: dateFormat = 'short',
    weekdayFormat = null,
    timeFormat = null,
    color,
    fontWeight,
    style,
    noTooltip = false,
    timeOnlyTooltip = false,
    ...props
  }) => {
    const { countryTimeZone, facilityTimeZone } = useDateTimeFormat();

    const displayDate = useFormattedDate(dateValue, {
      dateFormat,
      weekdayFormat,
      timeFormat,
    });

    const content = (
      <span style={{ color, fontWeight, ...style }} {...props}>
        {displayDate}
      </span>
    );

    if (noTooltip) return content;

    return (
      <DateTooltip
        rawDate={dateValue}
        displayDate={displayDate}
        timeOnlyTooltip={timeOnlyTooltip}
        facilityTimeZone={facilityTimeZone}
        countryTimeZone={countryTimeZone}
      >
        {content}
      </DateTooltip>
    );
  },
);

/**
 * MultilineDatetimeDisplay - Shows date on one line and time below
 * @param {string|Date} date - The date value
 * @param {string} format - Date format (defaults to "short")
 * @param {boolean} isTimeSoft - Use soft/muted color for time (default true)
 *
 * @example
 * // Default → "15/03/2024" on first line, "9:30 am" below (muted)
 * <MultilineDatetimeDisplay date="2024-03-15 09:30:00" />
 */
export const MultilineDatetimeDisplay = React.memo(
  ({ date, format: dateFormat = 'short', isTimeSoft = true }) => {
    const TimeText = isTimeSoft ? SoftText : Text;
    return (
      <Box>
        <DateDisplay date={date} format={dateFormat} />
        <TimeText>
          <TimeDisplay date={date} />
        </TimeText>
      </Box>
    );
  },
);

/**
 * TimeRangeDisplay - Shows a time range like "9:30am – 10:00am"
 * @param {Object} range - Object with start and end date/time values
 * @param {string|Date} range.start - The start time
 * @param {string|Date} range.end - The end time
 *
 * @example
 * // → "9:30am – 10:00am"
 * <TimeRangeDisplay range={{ start: "2024-03-15 09:30:00", end: "2024-03-15 10:00:00" }} />
 */
export const TimeRangeDisplay = ({ range: { start, end } }) => (
  <>
    <TimeDisplay date={start} format="compact" noTooltip /> &ndash;{' '}
    <TimeDisplay date={end} format="compact" noTooltip />
  </>
);

/**
 * DateTimeRangeDisplay - Shows a date/time range, intelligently handling multi-day spans
 * @param {string|Date} start - The start date/time
 * @param {string|Date} end - The end date/time (optional)
 * @param {string} weekdayFormat - "short" | "long" | "narrow" | null (default, no weekday)
 * @param {string} dateFormat - Date format (default "short")
 * @param {string} timeFormat - Time format (default "compact")
 *
 * @example
 * // Same day → "Fri 15/03/2024 9:30am – 10:00am"
 * <DateTimeRangeDisplay start="2024-03-15 09:30:00" end="2024-03-15 10:00:00" weekdayFormat="short" />
 *
 * // Multi-day → "Fri 15/03/2024 9:30am – 16/03/2024 10:00am"
 * <DateTimeRangeDisplay start="2024-03-15 09:30:00" end="2024-03-16 10:00:00" weekdayFormat="short" />
 *
 * // No end → "Fri 15/03/2024 9:30am"
 * <DateTimeRangeDisplay start="2024-03-15 09:30:00" weekdayFormat="short" />
 */
export const DateTimeRangeDisplay = React.memo(
  ({ start, end, weekdayFormat = null, dateFormat = 'short', timeFormat = 'compact' }) => {
    const startDate = parseDate(start);
    const endDate = end ? parseDate(end) : null;
    const spansMultipleDays = endDate && !isSameDay(startDate, endDate);

    return (
      <span>
        <DateDisplay
          date={start}
          format={dateFormat}
          weekdayFormat={weekdayFormat}
          timeFormat={timeFormat}
          noTooltip
        />
        {endDate && (
          <>
            &nbsp;&ndash;{' '}
            {spansMultipleDays ? (
              <DateDisplay
                date={end}
                format={dateFormat}
                timeFormat={timeFormat}
                noTooltip
              />
            ) : (
              <TimeDisplay date={end} format={timeFormat} noTooltip />
            )}
          </>
        )}
      </span>
    );
  },
);
