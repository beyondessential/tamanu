import React, { useState } from 'react';
import { format } from 'date-fns';
import { getTimezoneOffset } from 'date-fns-tz';
import { Box, Typography } from '@material-ui/core';
import styled from 'styled-components';
import { parseDate, locale } from '@tamanu/utils/dateTime';
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

const DiagnosticInfo = ({ date: parsedDate, rawDate, timeZone, countryTimeZone }) => {
  const { formatLong } = useDateTimeFormat();
  const displayDate = formatLong(parsedDate);

  const getFormattedOffset = (tz, date) => {
    if (!tz) return 'N/A';

    const offsetMs = getTimezoneOffset(tz, date);
    const offsetMinutes = Math.abs(offsetMs / 60000);
    const hours = Math.floor(offsetMinutes / 60);
    const minutes = offsetMinutes % 60;
    const sign = offsetMs >= 0 ? '+' : '-';
    return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

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
    <ThemedTooltip open={tooltipOpen} onClose={handleClose} onOpen={handleOpen} title={tooltipTitle}>
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
 */
export const TimeDisplay = React.memo(
  ({ date: dateValue, format: timeFormat = 'default', noTooltip = false, style, ...props }) => {
    const { displayString, timeZone, countryTimeZone } = useFormattedDate(dateValue, { timeFormat });
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
 * DateDisplay - Displays date with optional time
 * @param {string|Date} date - The date value
 * @param {string} format - "short" (default) | "shortest" | "long" | "explicit" | "explicitShort" | null (for weekday-only)
 * @param {boolean} showWeekday - Prefix with weekday name (or show alone if format is null)
 * @param {boolean} showTime - Include time
 * @param {string} timeFormat - "default" | "compact" | "withSeconds"
 * @param {boolean} noTooltip - Disable hover tooltip
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
 * MultilineDatetimeDisplay - Shows date on one line and time below
 * @param {string|Date} date - The date value
 * @param {string} format - Date format (defaults to "short")
 * @param {boolean} isTimeSoft - Use soft/muted color for time (default true)
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
 */
export const TimeRangeDisplay = ({ range: { start, end } }) => {
  const { formatTimeCompact } = useDateTimeFormat();
  return (
    <>
      {formatTimeCompact(start)}&nbsp;&ndash; {formatTimeCompact(end)}
    </>
  );
};
