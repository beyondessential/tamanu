import React from 'react';
import { getTimezoneOffset } from 'date-fns-tz';

import { locale } from '@tamanu/utils/dateTime';

/**
 * Get the formatted offset for a given timezone.
 * @example
 * getFormattedOffset('Australia/Sydney') // '+11:00'
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

export const DiagnosticInfo = ({ rawDate, displayDate, facilityTimeZone, globalTimeZone }) => {
  const displayTimeZone = facilityTimeZone || globalTimeZone;
  const displayOffset = getFormattedOffset(displayTimeZone);
  const parsedRawDate = typeof rawDate === 'string' ? rawDate : rawDate.toISOString();
  return (
    <div>
      <strong>Raw date:</strong> {parsedRawDate} <br />
      <strong>Global timezone:</strong> {globalTimeZone} <br />
      <strong>Displayed timezone:</strong> {displayTimeZone} <br />
      <strong>Displayed offset:</strong> {displayOffset} <br />
      <strong>Display date:</strong> {displayDate} <br />
      <strong>Locale:</strong> {locale}
    </div>
  );
};
