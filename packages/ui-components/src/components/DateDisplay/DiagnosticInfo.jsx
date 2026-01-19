import React from 'react';

import { locale } from '@tamanu/utils/dateTime';

import { useDateTimeFormat } from '../../contexts/DateTimeContext';
import { getTimezoneOffset } from 'date-fns-tz';

/**
 * Get the formatted offset for a given timezone.
 * @example
 * getFormattedOffset('Australia/Sydney', new Date()) // '+11:00'
 */
const getFormattedOffset = (tz) => {
  if (!tz) return 'N/A';
  const offsetMs = getTimezoneOffset(tz, new Date());
  const offsetMinutes = Math.abs(offsetMs / 60000);
  const hours = Math.floor(offsetMinutes / 60);
  const minutes = offsetMinutes % 60;
  const sign = offsetMs >= 0 ? '+' : '-';
  return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export const DiagnosticInfo = ({ date, facilityTimeZone, countryTimeZone }) => {
  const { formatLong } = useDateTimeFormat();
  const displayDate = formatLong(date);
  const displayTimeZone = facilityTimeZone || countryTimeZone;
  const displayOffset = getFormattedOffset(displayTimeZone);
  return (  
    <div>
      <strong>Raw date string:</strong> {date} <br />
      <strong>Source timezone:</strong> {countryTimeZone} <br />
      <strong>Display timezone:</strong> {displayTimeZone} <br />
      <strong>Display offset:</strong> {displayOffset} <br />
      <strong>Display date:</strong> {displayDate} <br />
      <strong>Locale:</strong> {locale}
    </div>
  );
};
