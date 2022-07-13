import React from 'react';
import moment from 'moment';
import styled from 'styled-components';
import { format } from 'date-fns';

import { enGB, enUS } from 'date-fns/locale';

const locales = { 'en-GB': enGB, 'en-US': enUS };

const formatDate = (date, formatStr, fallback) => {
  if (!date) return fallback;
  const locale = locales[window.navigator.language] || enGB;
  return format(new Date(date), formatStr, { locale });
};

export const formatShort = date => {
  return formatDate(date, 'P', '--/--/----');
};

function formatLong(date) {
  if (!date) return 'Date information not available';

  return moment(date).format('LLLL'); // "Monday, March 4, 2019 10:22 AM"
}

function formatDuration(date) {
  return moment(date).from(moment(), true);
}

export function formatTime(date) {
  return moment(date).format('hh:mm a');
}

function formatShortExplicit(date) {
  if (!date) return 'Unknown';

  return moment(date).format('Do MMM YYYY'); // "4th Mar 2019" unambiguous short format
}

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
