//! CountryDateTime functions are server only
//! Servers require a specific reference to timeZone since most of our servers are in UTC

import { formatISO9075, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import config from 'config';
import {
  ISO8061_WITH_TIMEZONE,
  ISO9075_DATE_FORMAT,
  ISO9075_DATETIME_FORMAT,
} from '@tamanu/utils/dateTime';

export function toCountryDateTimeString(date) {
  if (date === null || date === undefined) {
    return null;
  }

  return formatInTimeZone(date, config?.globalTimeZone, ISO9075_DATETIME_FORMAT);
}

export function toCountryDateString(date) {
  if (date === null || date === undefined) {
    return null;
  }

  return formatInTimeZone(date, config?.globalTimeZone, ISO9075_DATE_FORMAT);
}

export function dateTimeStringIntoglobalTimeZone(date) {
  if (date === null || date === undefined) {
    return null;
  }

  return parseISO(formatInTimeZone(date, config?.globalTimeZone, ISO8061_WITH_TIMEZONE));
}

export function getCurrentglobalTimeZoneDateTimeString() {
  // Use the globalTimeZone if set, other wise fallback to the server time zone
  if (config?.globalTimeZone) {
    return formatInTimeZone(new Date(), config.globalTimeZone, ISO9075_DATETIME_FORMAT);
  }
  return formatISO9075(new Date());
}

export function getCurrentglobalTimeZoneDateString() {
  // Use the globalTimeZone if set, other wise fallback to the server time zone
  if (config?.globalTimeZone) {
    return formatInTimeZone(new Date(), config.globalTimeZone, ISO9075_DATE_FORMAT);
  }
  return formatISO9075(new Date(), { representation: 'date' });
}
