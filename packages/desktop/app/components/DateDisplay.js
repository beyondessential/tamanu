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

const StyledAbbr = styled.abbr`
  text-decoration: none;
`;

export const DateDisplay = React.memo(({ date, showDuration = false }) => (
  <StyledAbbr title={formatLong(date)}>
    {formatShort(date)}
    {showDuration && ` (${formatDuration(date)})`}
  </StyledAbbr>
));
