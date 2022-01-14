import React from 'react';
import moment from 'moment';
import styled from 'styled-components';

export function formatShort(date) {
  if (!date) return '--/--/----';

  return moment(date).format('DD/MM/YYYY'); // "04/03/2019" dd/mm in locale order
}

function formatLong(date) {
  if (!date) return 'Date information not available';

  return moment(date).format('LLLL'); // "Monday, March 4, 2019 10:22 AM"
}

function formatDuration(date) {
  return moment(date).from(moment(), true);
}

function formatTime(date) {
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
    <StyledAbbr {...props} title={formatLong(date)}>
      {parts.join(' ')}
    </StyledAbbr>
  );
};

DateDisplay.rawFormat = formatShort;
