import React, { useState } from 'react';
import { remote } from 'electron';
import { format } from 'date-fns';
import { parseDate } from '@tamanu/shared/utils/dateTime';
import { Typography, Box } from '@material-ui/core';
import styled from 'styled-components';
import { ThemedTooltip } from './Tooltip';

import { Colors } from '../constants';

const Text = styled(Typography)`
  font-size: inherit;
  line-height: inherit;
  margin-top: -2px;
`;

const SoftText = styled(Text)`
  color: ${Colors.midText};
`;

const getLocale = () => remote.getGlobal('osLocales') || remote.app.getLocale() || 'default';

const intlFormatDate = (date, formatOptions, fallback = 'Unknown') => {
  if (!date) return fallback;
  return new Date(date).toLocaleString(getLocale(), formatOptions);
};

export const formatShortest = date =>
  intlFormatDate(date, { month: '2-digit', day: '2-digit', year: '2-digit' }, '--/--'); // 12/04/20

export const formatShort = date =>
  intlFormatDate(date, { day: '2-digit', month: '2-digit', year: 'numeric' }, '--/--/----'); // 12/04/2020

export const formatTime = date =>
  intlFormatDate(
    date,
    {
      timeStyle: 'short',
      hour12: true,
    },
    '__:__',
  ); // 12:30 am

export const formatTimeWithSeconds = date =>
  intlFormatDate(
    date,
    {
      timeStyle: 'medium',
      hour12: true,
    },
    '__:__:__',
  ); // 12:30:00 am

const formatShortExplicit = date =>
  intlFormatDate(date, {
    dateStyle: 'medium',
  }); // "4 Mar 2019"

const formatShortestExplicit = date =>
  intlFormatDate(date, {
    year: '2-digit',
    month: 'short',
    day: 'numeric',
  }); // "4 Mar 19"

// long format date is displayed on hover
export const formatLong = date =>
  intlFormatDate(
    date,
    {
      timeStyle: 'short',
      dateStyle: 'full',
      hour12: true,
    },
    'Date information not available',
  ); // "Thursday, 14 July 2022, 03:44 pm"

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
      Locale: {getLocale()}
    </div>
  );
};

// Tooltip that shows the long date or full diagnostic date info if the shift key is held down
// before mousing over the date display
const DateTooltip = ({ date, children, timeOnlyTooltip }) => {
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

  const dateTooltip = timeOnlyTooltip ? formatTime(date) : formatLong(date);

  const tooltipTitle = debug ? <DiagnosticInfo date={date} /> : dateTooltip;

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

export const DateDisplay = React.memo(
  ({
    date: dateValue,
    showDate = true,
    showTime = false,
    showExplicitDate = false,
    shortYear = false,
    timeOnlyTooltip = false,
  }) => {
    const dateObj = parseDate(dateValue);

    const parts = [];
    if (showDate) {
      if (shortYear) {
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
      parts.push(formatTime(dateObj));
    }

    return (
      <DateTooltip date={dateObj} timeOnlyTooltip={timeOnlyTooltip}>
        <span>{parts.join(' ')}</span>
      </DateTooltip>
    );
  },
);

export const MultilineDatetimeDisplay = React.memo(
  ({ date, showExplicitDate, isTimeSoft = true }) => {
    const TimeText = isTimeSoft ? SoftText : Text;
    return (
      <Box>
        <DateDisplay date={date} showExplicitDate={showExplicitDate} />
        <TimeText>{formatTime(date)}</TimeText>
      </Box>
    );
  },
);

DateDisplay.rawFormat = formatShort;
