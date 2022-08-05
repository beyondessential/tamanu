import React from 'react';
import Tooltip from '@material-ui/core/Tooltip';

const intlFormatDate = (date, formatOptions, fallback = 'Unknown') => {
  if (!date) return fallback;
  return new Date(date).toLocaleString('default', formatOptions);
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

const DiagnosticInfo = ({ date, rawDate }) => {
  const displayDate = formatLong(date);
  const { timeZone } = Intl.DateTimeFormat().resolvedOptions();
  const timeZoneOffset = date.getTimezoneOffset() / 60;

  return (
    <div>
      Display date: {displayDate} <br />
      Raw date: {rawDate.toString()} <br />
      Timezone: {timeZone} <br />
      Timezone offset: {timeZoneOffset}
    </div>
  );
};

export const DateDisplay = React.memo(
  ({ date: dateValue, showDate = true, showTime = false, showExplicitDate = false }) => {
    const [tooltipOpen, setTooltipOpen] = React.useState(false);
    const [debug, setDebug] = React.useState(false);

    let date = dateValue;

    if (typeof date === 'string') {
      date = new Date(date);
    }

    const parts = [];
    if (showDate) {
      parts.push(formatShort(date));
    } else if (showExplicitDate) {
      parts.push(formatShortExplicit(date));
    }
    if (showTime) {
      parts.push(formatTime(date));
    }

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

    const tooltip = debug ? <DiagnosticInfo date={date} rawDate={dateValue} /> : formatLong(date);

    return (
      <Tooltip tooltipOpen={tooltipOpen} onClose={handleClose} onOpen={handleOpen} title={tooltip}>
        <span>{parts.join(' ')}</span>
      </Tooltip>
    );
  },
);

DateDisplay.rawFormat = formatShort;
