import React, { useState } from 'react';
import { format } from 'date-fns';
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

const formatShortExplicit = (date, timezone, countryTimeZone) =>
  intlFormatDate(date, {
    dateStyle: 'medium',
  }, 'Unknown', timezone, countryTimeZone); // "4 Mar 2019"

const formatShortestExplicit = (date, timezone, countryTimeZone) =>
  intlFormatDate(date, {
    year: '2-digit',
    month: 'short',
    day: 'numeric',
  }, 'Unknown', timezone, countryTimeZone); // "4 Mar 19"

// Diagnostic info for debugging
const DiagnosticInfo = ({ date: rawDate }) => {
  const date = new Date(rawDate);
  const displayDate = formatLong(date);
  const { timeZone } = Intl.DateTimeFormat().resolvedOptions();
  const timeZoneOffset = format(date, 'XXX');

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
const DateTooltip = ({ date, children, timeOnlyTooltip, timezone, countryTimeZone }) => {
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

  const dateTooltip = timeOnlyTooltip ? formatTime(date, timezone, countryTimeZone) : formatLong(date, timezone, countryTimeZone);

  const tooltipTitle = debug ? (
    <DiagnosticInfo date={date} data-testid="diagnosticinfo-adv2" />
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
  { showDate = true, showTime = false, showExplicitDate = false, shortYear = false, timezone = null, countryTimeZone = null } = {},
) => {
  const dateObj = parseDate(dateValue);

  const parts = [];
  if (showDate) {
    if (shortYear) {
      parts.push(formatShortest(dateObj, timezone, countryTimeZone));
    } else {
      parts.push(formatShort(dateObj, timezone, countryTimeZone));
    }
  } else if (showExplicitDate) {
    if (shortYear) {
      parts.push(formatShortestExplicit(dateObj, timezone, countryTimeZone));
    } else {
      parts.push(formatShortExplicit(dateObj, timezone, countryTimeZone));
    }
  }
  if (showTime) {
    parts.push(formatTime(dateObj, timezone, countryTimeZone));
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
    const timezone = getSetting('timezone');
    const countryTimeZone = getSetting('countryTimeZone');
    const displayDateString = getDateDisplay(dateValue, { timezone, countryTimeZone, ...props });

    if (noTooltip) {
      return <span style={{ color, fontWeight, ...style }}>{displayDateString}</span>;
    }

    const dateObj = parseDate(dateValue);
    return (
      <DateTooltip date={dateObj} timeOnlyTooltip={timeOnlyTooltip} timezone={timezone} countryTimeZone={countryTimeZone} data-testid="datetooltip-mhkq">
        <span style={{ color, fontWeight, ...style }}>{displayDateString}</span>
      </DateTooltip>
    );
  },
);

export const MultilineDatetimeDisplay = React.memo(
  ({ date, showExplicitDate, isTimeSoft = true }) => {
    const { getSetting } = useSettings();
    const timezone = getSetting('timezone');
    const countryTimeZone = getSetting('countryTimeZone');
    const TimeText = isTimeSoft ? SoftText : Text;
    return (
      <Box data-testid="box-ana9">
        <DateDisplay
          date={date}
          showExplicitDate={showExplicitDate}
          data-testid="datedisplay-qqlo"
        />
        <TimeText data-testid="timetext-5t0o">{formatTime(date, timezone, countryTimeZone)}</TimeText>
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
