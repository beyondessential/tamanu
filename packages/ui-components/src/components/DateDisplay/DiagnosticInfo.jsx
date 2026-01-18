import React from 'react';
import { getTimezoneOffset } from 'date-fns-tz';
import { locale } from '@tamanu/utils/dateTime';
import { useDateTimeFormat } from '../../contexts/DateTimeContext';

const getFormattedOffset = (tz, date) => {
  if (!tz) return 'N/A';
  const offsetMs = getTimezoneOffset(tz, date);
  const offsetMinutes = Math.abs(offsetMs / 60000);
  const hours = Math.floor(offsetMinutes / 60);
  const minutes = offsetMinutes % 60;
  const sign = offsetMs >= 0 ? '+' : '-';
  return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export const DiagnosticInfo = ({ date, timeZone, countryTimeZone }) => {
  const { formatLong } = useDateTimeFormat();
  const displayDate = formatLong(date);
  const now = new Date();
  const displayOffset = getFormattedOffset(timeZone, now);
  return (
    <div>
      <strong>Raw date string:</strong> {date} <br />
      <strong>Source timezone:</strong> {countryTimeZone || 'N/A'} <br />
      <strong>Display timezone:</strong> {timeZone || 'N/A'} <br />
      <strong>Display offset:</strong> {displayOffset} <br />
      <strong>Display date:</strong> {displayDate} <br />
      <strong>Locale:</strong> {locale}
    </div>
  );
};
