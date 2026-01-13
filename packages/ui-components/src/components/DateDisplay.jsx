import React, { useState } from 'react';
import { format, isSameDay } from 'date-fns';
import { getTimezoneOffset } from 'date-fns-tz';
import { Box, Typography } from '@material-ui/core';
import styled from 'styled-components';
import {
  parseDate,
  locale,
  formatDateOnlyShort,
  formatTimeOnlyCompact,
} from '@tamanu/utils/dateTime';
import { TAMANU_COLORS } from '../constants';
import { ThemedTooltip } from './Tooltip';
import { useDateTimeFormat } from '../contexts';

const Text = styled(Typography)`
  font-size: inherit;
  line-height: inherit;
  margin-top: -2px;
`;

const SoftText = styled(Text)`
  color: ${TAMANU_COLORS.midText};
`;

const getFormattedOffset = (tz, date) => {
  if (!tz) return 'N/A';
  const offsetMs = getTimezoneOffset(tz, date);
  const offsetMinutes = Math.abs(offsetMs / 60000);
  const hours = Math.floor(offsetMinutes / 60);
  const minutes = offsetMinutes % 60;
  const sign = offsetMs >= 0 ? '+' : '-';
  return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const DiagnosticInfo = ({ date: parsedDate, rawDate, timeZone, countryTimeZone }) => {
  const { formatLong } = useDateTimeFormat();
  const displayDate = formatLong(parsedDate);
  const now = new Date();
  const displayOffset = getFormattedOffset(timeZone, now);
  const sourceOffset = getFormattedOffset(countryTimeZone, now);
  const deviceOffset = format(now, 'XXX');

  return (
    <div>
      <strong>Raw date string:</strong> {rawDate} <br />
      <strong>Source timezone:</strong> {countryTimeZone || 'N/A'} ({sourceOffset}) <br />
      <strong>Display timezone:</strong> {timeZone || 'N/A'} ({displayOffset}) <br />
      <strong>Device timezone:</strong> {Intl.DateTimeFormat().resolvedOptions().timeZone} (
      {deviceOffset}) <br />
      <strong>Display date:</strong> {displayDate} <br />
      <strong>Locale:</strong> {locale}
    </div>
  );
};

const DateTooltip = ({ date, rawDate, children, timeOnlyTooltip, timeZone, countryTimeZone }) => {
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
    <TimeDisplay date={date} />
  ) : (
    <DateDisplay date={date} showTime />
  );

  const tooltipTitle = debug ? (
    <DiagnosticInfo
      date={date}
      rawDate={rawDate}
      countryTimeZone={countryTimeZone}
      timeZone={timeZone}
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
};

const TIME_FORMATS = {
  default: 'formatTime',
  compact: 'formatTimeCompact',
  withSeconds: 'formatTimeWithSeconds',
  slot: 'formatTimeSlot',
};

const useFormattedDate = (dateValue, { dateFormat, timeFormat, showWeekday }) => {
  const { timeZone, countryTimeZone, ...formatters } = useDateTimeFormat();
  const dateObj = parseDate(dateValue);
  const parts = [];

  if (showWeekday) {
    parts.push(formatters.formatWeekdayShort(dateObj));
  }

  if (dateFormat) {
    const formatterName = DATE_FORMATS[dateFormat] || DATE_FORMATS.short;
    parts.push(formatters[formatterName](dateObj));
  }

  if (timeFormat) {
    const formatterName = TIME_FORMATS[timeFormat] || TIME_FORMATS.default;
    parts.push(formatters[formatterName](dateObj));
  }

  return { displayString: parts.join(' '), timeZone, countryTimeZone };
};

/**
 * TimeDisplay - Displays time only
 * @param {string|Date} date - The date/time value
 * @param {string} format - "default" | "compact" | "withSeconds" | "slot"
 * @param {boolean} noTooltip - Disable hover tooltip
 *
 * @example
 * // format="default" → "9:30 AM"
 * <TimeDisplay date="2024-03-15 09:30:00" />
 *
 * // format="compact" → "9:30am" (time with minutes, no space)
 * <TimeDisplay date="2024-03-15 09:30:00" format="compact" />
 *
 * // format="withSeconds" → "9:30:45 AM"
 * <TimeDisplay date="2024-03-15 09:30:45" format="withSeconds" />
 *
 * // format="slot" → "9am" (hour only, for calendar slots)
 * <TimeDisplay date="2024-03-15 09:30:00" format="slot" />
 */
export const TimeDisplay = React.memo(
  ({ date: dateValue, format, noTooltip = false, style, ...props }) => {
    const { displayString, timeZone, countryTimeZone } = useFormattedDate(dateValue, {
      timeFormat: format,
    });
    const content = (
      <span style={style} {...props}>
        {displayString}
      </span>
    );

    if (noTooltip) return content;

    return (
      <DateTooltip
        date={parseDate(dateValue)}
        rawDate={dateValue}
        timeOnlyTooltip
        timeZone={timeZone}
        countryTimeZone={countryTimeZone}
      >
        {content}
      </DateTooltip>
    );
  },
);

/**
 * DateDisplay - Displays date with optional time (applies timezone conversion)
 * @param {string|Date} date - The date value
 * @param {string} format - "short" (default) | "shortest" | "long" | "explicit" | "explicitShort" | null (for weekday-only)
 * @param {boolean} showWeekday - Prefix with weekday name (or show alone if format is null)
 * @param {boolean} showTime - Include time
 * @param {string} timeFormat - "default" | "compact" | "withSeconds"
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
 * // format="explicit" → "15 Mar 2024"
 * <DateDisplay date="2024-03-15 09:30:00" format="explicit" />
 *
 * // format="explicitShort" → "15 Mar 24"
 * <DateDisplay date="2024-03-15 09:30:00" format="explicitShort" />
 *
 * // showTime → "15/03/2024 9:30 AM"
 * <DateDisplay date="2024-03-15 09:30:00" showTime />
 */
export const DateDisplay = React.memo(
  ({
    date: dateValue,
    format: dateFormat,
    showWeekday = false,
    showTime = false,
    timeFormat,
    color,
    fontWeight,
    style,
    noTooltip = false,
    timeOnlyTooltip = false,
    ...props
  }) => {
    const resolvedDateFormat = dateFormat === undefined ? 'short' : dateFormat;
    const resolvedTimeFormat = showTime ? timeFormat || 'default' : null;

    const { displayString, timeZone, countryTimeZone } = useFormattedDate(dateValue, {
      dateFormat: resolvedDateFormat,
      timeFormat: resolvedTimeFormat,
      showWeekday,
    });

    const content = (
      <span style={{ color, fontWeight, ...style }} {...props}>
        {displayString}
      </span>
    );

    if (noTooltip) return content;

    return (
      <DateTooltip
        date={parseDate(dateValue)}
        rawDate={dateValue}
        timeOnlyTooltip={timeOnlyTooltip}
        timeZone={timeZone}
        countryTimeZone={countryTimeZone}
      >
        {content}
      </DateTooltip>
    );
  },
);

/**
 * DateOnlyDisplay - Displays a date-only value without timezone conversion
 * Use for dates that don't have a time component (DOB, death date, etc.)
 * @param {string|Date} date - The date value
 *
 * @example
 * <DateOnlyDisplay date="1990-05-15" />
 * <DateOnlyDisplay date={patient.dateOfBirth} />
 */
export const DateOnlyDisplay = React.memo(({ date, color, fontWeight, style, ...props }) => (
  <span style={{ color, fontWeight, ...style }} {...props}>
    {formatDateOnlyShort(date)}
  </span>
));

/** TODO: these are stupid, need to think of better strat for these timezone conversionless dates */
export const TimeOnlyDisplay = React.memo(({ date, style, ...props }) => {
  return (
    <span style={style} {...props}>
      {formatTimeOnlyCompact(date)}
    </span>
  );
});

/**
 * MultilineDatetimeDisplay - Shows date on one line and time below
 * @param {string|Date} date - The date value
 * @param {string} format - Date format (defaults to "short")
 * @param {boolean} isTimeSoft - Use soft/muted color for time (default true)
 *
 * @example
 * // Default → "15/03/2024" on first line, "9:30 AM" below (muted)
 * <MultilineDatetimeDisplay date="2024-03-15 09:30:00" />
 *
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
// TODO: plz remove this daniel
export const TimeRangeDisplay = ({ range: { start, end } }) => `${formatTimeOnlyCompact(start)} &ndash; ${formatTimeOnlyCompact(end)}`;


/**
 * DateTimeRangeDisplay - Shows a date/time range, intelligently handling multi-day spans
 * @param {string|Date} start - The start date/time
 * @param {string|Date} end - The end date/time (optional)
 * @param {boolean} showWeekday - Show weekday for start date (default true)
 * @param {string} dateFormat - Date format (default "short")
 * @param {string} timeFormat - Time format (default "compact")
 *
 * @example
 * // Same day → "Mon 15/03/2024 9:30am – 10:00am"
 * <DateTimeRangeDisplay start="2024-03-15 09:30:00" end="2024-03-15 10:00:00" />
 *
 * // Multi-day → "Mon 15/03/2024 9:30am – 16/03/2024 10:00am"
 * <DateTimeRangeDisplay start="2024-03-15 09:30:00" end="2024-03-16 10:00:00" />
 *
 * // No end → "Mon 15/03/2024 9:30am"
 * <DateTimeRangeDisplay start="2024-03-15 09:30:00" />
 */
export const DateTimeRangeDisplay = React.memo(
  ({ start, end, showWeekday = true, dateFormat = 'short', timeFormat = 'compact' }) => {
    const startDate = parseDate(start);
    const endDate = end ? parseDate(end) : null;
    const spansMultipleDays = endDate && !isSameDay(startDate, endDate);

    return (
      <span>
        <DateDisplay
          date={start}
          format={dateFormat}
          showWeekday={showWeekday}
          showTime
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
                showTime
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
