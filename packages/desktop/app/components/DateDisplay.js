import React, { useState } from 'react';
import { remote } from 'electron';
import Tooltip from '@material-ui/core/Tooltip';
import { format, parseISO } from 'date-fns';
import { parseDate } from 'shared-src/src/utils/dateTime';

const getLocale = () => remote.getGlobal('osLocales') || remote.app.getLocale() || 'default';

const intlFormatDate = (date, formatOptions, fallback = 'Unknown') => {
  if (!date) return fallback;
  return date.toLocaleString(getLocale(), formatOptions);
};

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

const formatShortExplicit = date =>
  intlFormatDate(date, {
    dateStyle: 'medium',
  }); // "4 Mar 2019"

// long format date is displayed on hover
const formatLong = date =>
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
  const date = parseISO(rawDate);
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
const DateTooltip = ({ date, children }) => {
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

  const tooltipTitle = debug ? <DiagnosticInfo date={date} /> : formatLong(date);

  return (
    <Tooltip open={tooltipOpen} onClose={handleClose} onOpen={handleOpen} title={tooltipTitle}>
      {children}
    </Tooltip>
  );
};

export const DateDisplay = React.memo(
  ({ date: dateValue, showDate = true, showTime = false, showExplicitDate = false }) => {
    const dateObj = parseDate(dateValue);

    const parts = [];
    if (showDate) {
      parts.push(formatShort(dateObj));
    } else if (showExplicitDate) {
      parts.push(formatShortExplicit(dateObj));
    }
    if (showTime) {
      parts.push(formatTime(dateObj));
    }

    return (
      <DateTooltip date={dateObj}>
        <span>{parts.join(' ')}</span>
      </DateTooltip>
    );
  },
);

DateDisplay.rawFormat = formatShort;
