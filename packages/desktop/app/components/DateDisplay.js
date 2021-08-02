import React from 'react';
import moment from 'moment';
import styled from 'styled-components';

function formatShort(date) {
  if (!date) return '--/--/----';

  return moment(date).format('D/MM/YYYY'); // "04/03/2019" dd/mm in locale order
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

const StyledAbbr = styled.abbr`
  text-decoration: none;
`;

export const DateDisplay = ({
  date,
  showDate = true,
  showTime = false,
  showDuration = false,
  ...props
}) => {
  const parts = [];
  if (showDate) {
    parts.push(formatShort(date));
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
