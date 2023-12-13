// ! CountryDateTime functions are server only
// ! Servers require a specific reference to timeZone since most of our servers are in UTC

import config from 'config';
import { formatISO9075, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { ISO8061_WITH_TIMEZONE, ISO9075_DATE_FORMAT, ISO9075_DATETIME_FORMAT } from './dateTime';

export function toCountryDateTimeString(date) {
  if (date === null || date === undefined) {
    return null;
  }

  return formatInTimeZone(date, config?.countryTimeZone, ISO9075_DATETIME_FORMAT);
}

export function toCountryDateString(date) {
  if (date === null || date === undefined) {
    return null;
  }

  return formatInTimeZone(date, config?.countryTimeZone, ISO9075_DATE_FORMAT);
}

export function dateTimeStringIntoCountryTimezone(date) {
  if (date === null || date === undefined) {
    return null;
  }

  return parseISO(formatInTimeZone(date, config?.countryTimeZone, ISO8061_WITH_TIMEZONE));
}

export function getCurrentCountryTimeZoneDateTimeString() {
  // Use the countryTimeZone if set, other wise fallback to the server time zone
  if (config?.countryTimeZone) {
    return formatInTimeZone(new Date(), config.countryTimeZone, ISO9075_DATETIME_FORMAT);
  }
  return formatISO9075(new Date());
}

export function getCurrentCountryTimeZoneDateString() {
  // Use the countryTimeZone if set, other wise fallback to the server time zone
  if (config?.countryTimeZone) {
    return formatInTimeZone(new Date(), config.countryTimeZone, ISO9075_DATE_FORMAT);
  }
  return formatISO9075(new Date(), { representation: 'date' });
}
