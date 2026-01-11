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
  color: pink;
`;

const SoftText = styled(Text)`
  color: ${TAMANU_COLORS.midText};
`;

// Diagnostic info for debugging
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

  const dateTooltip = timeOnlyTooltip ? (
    <DateDisplay date={date} showTime showDate={false} />
  ) : (
    <DateDisplay date={date} showDate showTime />
  );

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
  const {
    formatWeekdayShort,
    formatShortest,
    formatShort,
    formatShortestExplicit,
    formatShortExplicit,
    formatTimeWithSeconds,
    formatTime,
    formatFullDate,
    formatTimeCompact,
    formatTimeSlot,
  } = useDateTimeFormat();
  const dateObj = parseDate(dateValue);

  const parts = [];

  if (timeOnly) {
    parts.push(formatTimeSlot(dateObj));
    return parts.join(' ');
  }

  if (showWeekday) {
    parts.push(formatWeekdayShort(dateObj));
  }
  if (showDate) {
    if (longDateFormat) {
      parts.push(formatFullDate(dateObj));
    } else if (shortYear) {
      parts.push(formatShortest(dateObj));
    } else {
      parts.push(formatShort(dateObj));
    }
  } else if (showExplicitDate) {
    if (shortYear) {
      parts.push(formatShortestExplicit(dateObj));
    } else {
      parts.push(formatShortExplicit(dateObj));
    }
  }
  if (showTime) {
    if (includeSeconds) {
      parts.push(formatTimeWithSeconds(dateObj));
    } else if (compactTime) {
      parts.push(formatTimeCompact(dateObj));
    } else {
      parts.push(formatTime(dateObj));
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
    return (
      <Box data-testid="box-ana9">
        <DateDisplay
          date={date}
          showExplicitDate={showExplicitDate}
          data-testid="datedisplay-qqlo"
        />
        <TimeText data-testid="timetext-5t0o">
          <DateDisplay date={date} showTime showDate={false} />
        </TimeText>
      </Box>
    );
  },
);

export const TimeRangeDisplay = ({ range: { start, end } }) => {
  const { formatTimeCompact } = useDateTimeFormat();
  return (
    <>
      {formatTimeCompact(start)}&nbsp;&ndash; {formatTimeCompact(end)}
    </>
  );
};
