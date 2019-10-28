import React from 'react';
import moment from 'moment';
import styled from 'styled-components';

function formatShort(date) {
  if (!date) return '--/--/----';

  return moment(date).format('L'); // "04/03/2019" dd/mm in locale order
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

export const DateDisplay = React.memo(({ date, showDate = true, showTime = false, showDuration = false, ...props }) => (
  <StyledAbbr {...props} title={formatLong(date)}>
    {showDate && formatShort(date)}
    {' '}
    {showDuration && ` (${formatDuration(date)})`}
    {' '}
    {showTime && formatTime(date)}
  </StyledAbbr>
));

DateDisplay.rawFormat = formatShort;
