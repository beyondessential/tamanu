import React, { useState } from 'react';
import { format } from 'date-fns';
import { getTimezoneOffset } from 'date-fns-tz';
import { Box, Typography } from '@material-ui/core';
import styled from 'styled-components';
import {
  parseDate,
  intlFormatDate,
  formatShortest,
  formatShort,
  formatTime,
  formatTimeWithSeconds,
  locale,
  formatLong,
} from '@tamanu/utils/dateTime';
import { TAMANU_COLORS } from '../constants';
import { ThemedTooltip } from './Tooltip';
import { useSettings } from '../contexts';

const Text = styled(Typography)`
  font-size: inherit;
  line-height: inherit;
  margin-top: -2px;
`;

const SoftText = styled(Text)`
  color: ${TAMANU_COLORS.midText};
`;

const formatShortExplicit = (date, timeZone, countryTimeZone) =>
  intlFormatDate(date, {
    dateStyle: 'medium',
  }, 'Unknown', timeZone, countryTimeZone); // "4 Mar 2019"

const formatShortestExplicit = (date, timeZone, countryTimeZone) =>
  intlFormatDate(date, {
    year: '2-digit',
    month: 'short',
    day: 'numeric',
  }, 'Unknown', timeZone, countryTimeZone); // "4 Mar 19"

// Diagnostic info for debugging
const DiagnosticInfo = ({ date: rawDate, timeZone }) => {
  const date = new Date(rawDate);
  const displayDate = formatLong(date, timeZone);
  
  const getFormattedOffset = () => {
    if (!timeZone) return format(date, 'XXX');
    
    const offsetMs = getTimezoneOffset(timeZone, date);
    const offsetMinutes = Math.abs(offsetMs / 60000);
    const hours = Math.floor(offsetMinutes / 60);
    const minutes = offsetMinutes % 60;
    const sign = offsetMs >= 0 ? '+' : '-';
    return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };
  
  const timeZoneOffset = getFormattedOffset();
  
  return (
    <div>
      Display date: {displayDate} <br />
      Raw date: {date.toString()} <br />
      Time zone: {timeZone} <br />
      Time zone offset: {timeZoneOffset} <br />
      Locale: {locale}
    </div>
  );
};

// Tooltip that shows the long date or full diagnostic date info if the shift key is held down
// before mousing over the date display
const DateTooltip = ({ date, children, timeOnlyTooltip, timeZone, countryTimeZone }) => {
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

  const dateTooltip = timeOnlyTooltip ? formatTime(date, timeZone, countryTimeZone) : formatLong(date, timeZone, countryTimeZone);

  const tooltipTitle = debug ? (
    <DiagnosticInfo date={date} timeZone={timeZone} data-testid="diagnosticinfo-adv2" />
  ) : (
    dateTooltip
  );

  return (
    <ThemedTooltip
      open={tooltipOpen}
      onClose={handleClose}
      onOpen={handleOpen}
      title={tooltipTitle}
      data-testid="themedtooltip-k6a1"
    >
      {children}
    </ThemedTooltip>
  );
};

export const getDateDisplay = (
  dateValue,
  { showDate = true, showTime = false, showExplicitDate = false, shortYear = false, timeZone = null, countryTimeZone = null } = {},
) => {
  const dateObj = parseDate(dateValue);

  const parts = [];
  if (showDate) {
    if (shortYear) {
      parts.push(formatShortest(dateObj, timeZone, countryTimeZone));
    } else {
      parts.push(formatShort(dateObj, timeZone, countryTimeZone));
    }
  } else if (showExplicitDate) {
    if (shortYear) {
      parts.push(formatShortestExplicit(dateObj, timeZone, countryTimeZone));
    } else {
      parts.push(formatShortExplicit(dateObj, timeZone, countryTimeZone));
    }
  }
  if (showTime) {
    parts.push(formatTime(dateObj, timeZone, countryTimeZone));
  }

  return parts.join(' ');
};

export const DateDisplay = React.memo(
  ({
    color = 'currentcolor',
    date: dateValue,
    fontWeight,
    noTooltip = false,
    timeOnlyTooltip = false,
    style,
    ...props
  }) => {
    const { getSetting } = useSettings();
    const timeZone = getSetting('timezone');
    const countryTimeZone = getSetting('countryTimeZone');
    const displayDateString = getDateDisplay(dateValue, { timeZone, countryTimeZone, ...props });

    if (noTooltip) {
      return <span style={{ color, fontWeight, ...style }}>{displayDateString}</span>;
    }

    const dateObj = parseDate(dateValue);
    return (
      <DateTooltip date={dateObj} timeOnlyTooltip={timeOnlyTooltip} timeZone={timeZone} countryTimeZone={countryTimeZone} data-testid="datetooltip-mhkq">
        <span style={{ color, fontWeight, ...style }}>{displayDateString}</span>
      </DateTooltip>
    );
  },
);

export const MultilineDatetimeDisplay = React.memo(
  ({ date, showExplicitDate, isTimeSoft = true }) => {
    const { getSetting } = useSettings();
    const timeZone = getSetting('timezone');
    const countryTimeZone = getSetting('countryTimeZone');
    const TimeText = isTimeSoft ? SoftText : Text;
    return (
      <Box data-testid="box-ana9">
        <DateDisplay
          date={date}
          showExplicitDate={showExplicitDate}
          data-testid="datedisplay-qqlo"
        />
        <TimeText data-testid="timetext-5t0o">{formatTime(date, timeZone, countryTimeZone)}</TimeText>
      </Box>
    );
  },
);

export const TimeRangeDisplay = ({ range: { start, end } }) => (
  <>
    {format(start, 'h:mmaaa')}&nbsp;&ndash; {format(end, 'h:mmaaa')}
  </>
);

const VALID_FORMAT_FUNCTIONS = [
  formatShortest,
  formatShort,
  formatTime,
  formatTimeWithSeconds,
  formatShortExplicit,
  formatShortestExplicit,
  formatLong,
];

DateDisplay.stringFormat = (dateValue, formatFn = formatShort) => {
  if (VALID_FORMAT_FUNCTIONS.includes(formatFn) === false) {
    // If you're seeing this error, you probably need to move your format function to this file and add it to VALID_FORMAT_FUNCTIONS
    // This is done to ensure our date formats live in one central place in the code
    throw new Error('Invalid format function used, check DateDisplay component for options');
  }
  const dateObj = parseDate(dateValue);
  return formatFn(dateObj);
};
