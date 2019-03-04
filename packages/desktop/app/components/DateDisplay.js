import React from 'react';
import moment from 'moment';

function formatShort(date) {
  if(!date) return '--/--/----';

  return moment(date).format('L');
}

function formatLong(date) {
  if(!date) return 'Date information not available';

  return moment(date).format('LLLL');
}

export const DateDisplay = ({ date }) => (
  <abbr title={formatLong(date)}>{formatShort(date)}</abbr>
);
