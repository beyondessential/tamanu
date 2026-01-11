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

// Format options for dates
const DATE_FORMATS = {
  short: 'formatShort', // "01/12/2026"
  shortest: 'formatShortest', // "01/12/26"
  long: 'formatFullDate', // "Monday, 12 January 2026"
  explicit: 'formatShortExplicit', // "Jan 12, 2026"
  explicitShort: 'formatShortestExplicit', // "Jan 12, 24"
};

// Format options for times
const TIME_FORMATS = {
  default: 'formatTime', // "9:30 AM"
  compact: 'formatTimeCompact', // "9:30am"
  withSeconds: 'formatTimeWithSeconds', // "9:30:45 AM"
  slot: 'formatTimeSlot', // time slot format
};

/**
 * Formats a date value using the specified format options.
 */
const useFormattedDate = (dateValue, { dateFormat, timeFormat, showWeekday }) => {
  const formatters = useDateTimeFormat();
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

  return parts.join(' ');
};

/**
 * TimeDisplay - Displays time only
 *
 * @param {string|Date} date - The date/time value
 * @param {string} format - "default" | "compact" | "withSeconds" | "slot"
 */
export const TimeDisplay = React.memo(
  ({ date: dateValue, format: timeFormat = 'default', noTooltip = false, style, ...props }) => {
    const displayString = useFormattedDate(dateValue, { timeFormat });

    if (noTooltip) {
      return <span style={style}>{displayString}</span>;
    }

    const dateObj = parseDate(dateValue);
    return (
      <DateTooltip date={dateObj} rawDate={dateValue} timeOnlyTooltip>
        <span style={style} {...props}>
          {displayString}
        </span>
      </DateTooltip>
    );
  },
);

/**
 * DateDisplay - Displays date with optional time
 *
 * Props (new API):
 * @param {string|Date} date - The date value
 * @param {string} format - "short" | "shortest" | "long" | "explicit" | "explicitShort"
 * @param {boolean} showWeekday - Prefix with weekday name
 * @param {boolean} showTime - Include time
 * @param {string} timeFormat - "default" | "compact" | "withSeconds"
 * @param {boolean} noTooltip - Disable hover tooltip
 *
 * Legacy props (backwards compatible):
 * @param {boolean} showDate - Show date (default true)
 * @param {boolean} showExplicitDate - Use explicit month format
 * @param {boolean} shortYear - Use 2-digit year
 * @param {boolean} longDateFormat - Use full date format
 * @param {boolean} compactTime - Use compact time format
 * @param {boolean} includeSeconds - Include seconds in time
 * @param {boolean} timeOnly - Show only time slot
 */
export const DateDisplay = React.memo(
  ({
    date: dateValue,
    // New API
    format: dateFormat,
    timeFormat: timeFormatProp,
    // Styling
    color,
    fontWeight,
    style,
    // Tooltip
    noTooltip = false,
    timeOnlyTooltip = false,
    // Legacy props for backwards compatibility
    showDate = true,
    showTime = false,
    showExplicitDate = false,
    showWeekday = false,
    shortYear = false,
    longDateFormat = false,
    compactTime = false,
    includeSeconds = false,
    timeOnly = false,
    ...props
  }) => {
    // Resolve date format from legacy props if not using new API
    let resolvedDateFormat = dateFormat;
    if (!resolvedDateFormat && !timeOnly) {
      if (!showDate && showExplicitDate) {
        resolvedDateFormat = shortYear ? 'explicitShort' : 'explicit';
      } else if (showDate) {
        if (longDateFormat) {
          resolvedDateFormat = 'long';
        } else if (shortYear) {
          resolvedDateFormat = 'shortest';
        } else {
          resolvedDateFormat = 'short';
        }
      }
    }

    // Resolve time format
    let resolvedTimeFormat = timeFormatProp;
    if (timeOnly) {
      resolvedTimeFormat = 'slot';
    } else if (!resolvedTimeFormat && showTime) {
      if (includeSeconds) {
        resolvedTimeFormat = 'withSeconds';
      } else if (compactTime) {
        resolvedTimeFormat = 'compact';
      } else {
        resolvedTimeFormat = 'default';
      }
    }

    const displayString = useFormattedDate(dateValue, {
      dateFormat: timeOnly ? null : resolvedDateFormat,
      timeFormat: resolvedTimeFormat,
      showWeekday: timeOnly ? false : showWeekday,
    });

    const mergedStyle = { color, fontWeight, ...style };

    if (noTooltip) {
      return (
        <span style={mergedStyle} {...props}>
          {displayString}
        </span>
      );
    }

    const dateObj = parseDate(dateValue);
    return (
      <DateTooltip date={dateObj} rawDate={dateValue} timeOnlyTooltip={timeOnlyTooltip || timeOnly}>
        <span style={mergedStyle} {...props}>
          {displayString}
        </span>
      </DateTooltip>
    );
  },
);

/**
 * MultilineDatetimeDisplay - Shows date on one line and time below
 */
export const MultilineDatetimeDisplay = React.memo(
  ({ date, showExplicitDate, isTimeSoft = true }) => {
    const dateFormat = showExplicitDate ? 'explicit' : 'short';
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

// Legacy hook for backwards compatibility
export const useDateDisplay = (
  dateValue,
  {
    showDate = true,
    showTime = false,
    showExplicitDate = false,
    showWeekday = false,
    shortYear = false,
    longDateFormat = false,
    compactTime = false,
    timeOnly = false,
    includeSeconds = false,
  } = {},
) => {
  // Resolve date format
  let dateFormat = null;
  let timeFormat = null;

  if (timeOnly) {
    timeFormat = 'slot';
  } else {
    if (!showDate && showExplicitDate) {
      dateFormat = shortYear ? 'explicitShort' : 'explicit';
    } else if (showDate) {
      if (longDateFormat) {
        dateFormat = 'long';
      } else if (shortYear) {
        dateFormat = 'shortest';
      } else {
        dateFormat = 'short';
      }
    }

    // Resolve time format
    if (showTime) {
      if (includeSeconds) {
        timeFormat = 'withSeconds';
      } else if (compactTime) {
        timeFormat = 'compact';
      } else {
        timeFormat = 'default';
      }
    }
  }

  return useFormattedDate(dateValue, { dateFormat, timeFormat, showWeekday });
};
