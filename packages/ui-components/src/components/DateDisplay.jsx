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
  formatWeekdayShort,
} from '@tamanu/utils/dateTime';
import { TAMANU_COLORS } from '../constants';
import { ThemedTooltip } from './Tooltip';
import { useSettings } from '../contexts';

const Text = styled(Typography)`
  font-size: inherit;
  line-height: inherit;
  margin-top: -2px;
  color: pink;
`;

const SoftText = styled(Text)`
  color: ${TAMANU_COLORS.midText};
`;

const formatShortExplicit = (date, timeZone, countryTimeZone) =>
  intlFormatDate(
    date,
    {
      dateStyle: 'medium',
    },
    'Unknown',
    timeZone,
    countryTimeZone,
  ); // "4 Mar 2019"

const formatShortestExplicit = (date, timeZone, countryTimeZone) =>
  intlFormatDate(
    date,
    {
      year: '2-digit',
      month: 'short',
      day: 'numeric',
    },
    'Unknown',
    timeZone,
    countryTimeZone,
  ); // "4 Mar 19"

// Diagnostic info for debugging
const DiagnosticInfo = ({ date: parsedDate, rawDate, timeZone, countryTimeZone }) => {
  const displayDate = formatLong(parsedDate, countryTimeZone, timeZone);

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

// Tooltip that shows the long date or full diagnostic date info if the shift key is held down
// before mousing over the date display
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

  const dateTooltip = timeOnlyTooltip
    ? <DateDisplay date={date} showTime showDate={false} />
    : <DateDisplay date={date} showDate showTime />;

  const tooltipTitle = debug ? (
    <DiagnosticInfo
      date={date}
      rawDate={rawDate}
      countryTimeZone={countryTimeZone}
      timeZone={timeZone}
      data-testid="diagnosticinfo-adv2"
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
      data-testid="themedtooltip-k6a1"
    >
      {children}
    </ThemedTooltip>
  );
};

const useTimeZone = () => {
  const { getSetting } = useSettings();
  const timeZone = getSetting('timeZone');
  const countryTimeZone = 'Pacific/Auckland';
  return { timeZone, countryTimeZone };
};

export const useDateDisplay = (
  dateValue,
  {
    showDate = true,
    showTime = false,
    showExplicitDate = false,
    showWeekday = false,
    shortYear = false,
    removeWhitespace = false,
    includeSeconds = false,
  } = {},
) => {
  const { timeZone, countryTimeZone } = useTimeZone();
  const dateObj = parseDate(dateValue);

  const parts = [];
  if (showWeekday) {
    parts.push(formatWeekdayShort(dateObj, countryTimeZone, timeZone));
  }
  if (showDate) {
    if (shortYear) {
      parts.push(formatShortest(dateObj, countryTimeZone, timeZone));
    } else {
      parts.push(formatShort(dateObj, countryTimeZone, timeZone));
    }
  } else if (showExplicitDate) {
    if (shortYear) {
      parts.push(formatShortestExplicit(dateObj, countryTimeZone, timeZone));
    } else {
      parts.push(formatShortExplicit(dateObj, countryTimeZone, timeZone));
    }
  }
  if (showTime) {
    if (includeSeconds) {
      parts.push(formatTimeWithSeconds(dateObj, countryTimeZone, timeZone));
    } else {
      parts.push(formatTime(dateObj, countryTimeZone, timeZone, { removeWhitespace }));
    }
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
    const displayDateString = useDateDisplay(dateValue, props);

    if (noTooltip) {
      return <span style={{ color, fontWeight, ...style }}>{displayDateString}</span>;
    }

    const dateObj = parseDate(dateValue);
    return (
      <DateTooltip
        date={dateObj}
        rawDate={dateValue}
        timeOnlyTooltip={timeOnlyTooltip}
        data-testid="datetooltip-mhkq"
      >
        <span style={{ color: 'pink', fontWeight, ...style }}>{displayDateString}</span>
      </DateTooltip>
    );
  },
);

export const MultilineDatetimeDisplay = React.memo(
  ({ date, showExplicitDate, isTimeSoft = true }) => {
    const TimeText = isTimeSoft ? SoftText : Text;
    const timeString = useFormatTime(date);
    return (
      <Box data-testid="box-ana9">
        <DateDisplay
          date={date}
          showExplicitDate={showExplicitDate}
          data-testid="datedisplay-qqlo"
        />
        <TimeText data-testid="timetext-5t0o">{timeString}</TimeText>
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
  formatWeekdayShort,
];

export const useFormatShortest = date => {
  const { timeZone, countryTimeZone } = useTimeZone();
  return formatShortest(date, countryTimeZone, timeZone);
};

export const useFormatShort = date => {
  const { timeZone, countryTimeZone } = useTimeZone();
  return formatShort(date, countryTimeZone, timeZone);
};

export const useFormatTime = (date, options) => {
  const { timeZone, countryTimeZone } = useTimeZone();
  return formatTime(date, countryTimeZone, timeZone, options);
};

export const useFormatTimeWithSeconds = date => {
  const { timeZone, countryTimeZone } = useTimeZone();
  return formatTimeWithSeconds(date, countryTimeZone, timeZone);
};

export const useFormatShortExplicit = date => {
  const { timeZone, countryTimeZone } = useTimeZone();
  return formatShortExplicit(date, countryTimeZone, timeZone);
};

export const useFormatShortestExplicit = date => {
  const { timeZone, countryTimeZone } = useTimeZone();
  return formatShortestExplicit(date, countryTimeZone, timeZone);
};

export const useFormatLong = date => {
  const { timeZone, countryTimeZone } = useTimeZone();
  return formatLong(date, countryTimeZone, timeZone);
};

export const useFormatWeekdayShort = date => {
  const { timeZone, countryTimeZone } = useTimeZone();
  return formatWeekdayShort(date, countryTimeZone, timeZone);
};





DateDisplay.stringFormat = (dateValue, formatFn = formatShort) => {
  if (VALID_FORMAT_FUNCTIONS.includes(formatFn) === false) {
    // If you're seeing this error, you probably need to move your format function to this file and add it to VALID_FORMAT_FUNCTIONS
    // This is done to ensure our date formats live in one central place in the code
    throw new Error('Invalid format function used, check DateDisplay component for options');
  }
  const dateObj = parseDate(dateValue);
  return formatFn(dateObj);
};
