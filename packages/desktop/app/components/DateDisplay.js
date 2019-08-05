import React from 'react';
import moment from 'moment';

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

export const DateDisplay = React.memo(({ date, showDuration = false }) => (
  <abbr title={formatLong(date)}>
    {formatShort(date)}
    {showDuration && ` (${formatDuration(date)})`}
  </abbr>
));
