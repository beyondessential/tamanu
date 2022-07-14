import React from 'react';
import styled from 'styled-components';
import { formatDistanceToNow } from 'date-fns';

const intlFormatDate = (date, formatOptions, fallback = 'Unknown') => {
  if (!date) return fallback;
  return new Intl.DateTimeFormat('default', formatOptions).format(new Date(date));
};

export const formatShort = date => intlFormatDate(date, { dateStyle: 'short' }, '__/__/____'); // 12/04/2020

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

const formatDuration = date => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}; // 4 months ago

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

const StyledAbbr = styled.abbr`
  text-decoration: none;
`;

export const DateDisplay = ({
  date,
  showDate = true,
  showTime = false,
  showDuration = false,
  showExplicitDate = false,
  ...props
}) => {
  const parts = [];
  if (showDate) {
    parts.push(formatShort(date));
  } else if (showExplicitDate) {
    parts.push(formatShortExplicit(date));
  }
  if (showDuration) {
    parts.push(`(${formatDuration(date)})`);
  }
  if (showTime) {
    parts.push(formatTime(date));
  }
  return (
    <StyledAbbr {...props} title={formatLong(date)} data-test-class="date-display-abbr">
      {parts.join(' ')}
    </StyledAbbr>
  );
};

DateDisplay.rawFormat = formatShort;
