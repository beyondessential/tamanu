import React from 'react';
import styled from 'styled-components';

const intlFormatDate = (date, formatOptions, fallback = 'Unknown') => {
  if (!date) return fallback;
  return new Date(date).toLocaleString('default', formatOptions);
};

export const formatShort = date => intlFormatDate(date, { dateStyle: 'short' }, '--/--/----'); // 12/04/2020

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

// abbr tag allows a title to be passed in which shows the long format date on hover
const StyledAbbr = styled.abbr`
  text-decoration: none;
`;

export const DateDisplay = ({
  date,
  showDate = true,
  showTime = false,
  showExplicitDate = false,
  ...props
}) => {
  const parts = [];
  if (showDate) {
    parts.push(formatShort(date));
  } else if (showExplicitDate) {
    parts.push(formatShortExplicit(date));
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
