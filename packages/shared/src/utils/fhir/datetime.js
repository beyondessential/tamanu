import {
  isValid,
  parse,
  getDate,
  getHours,
  getMonth,
  getYear,
  getMinutes,
  getSeconds,
  format,
  formatISO9075,
  formatRFC3339,
} from 'date-fns';
import { getTimezoneOffset, zonedTimeToUtc } from 'date-fns-tz';
import { pick } from 'lodash';
import { date as yupDate, number, object, string } from 'yup';

import { FHIR_DATETIME_PRECISION } from '@tamanu/constants';
import { parseDate } from '../dateTime';
import { Exception } from './errors';

function extractTz(str) {
  // eslint-disable-next-line no-unused-vars
  const [_date, time] = str.split('T');

  const plus = time.lastIndexOf('+');
  if (plus !== -1) return time.slice(plus);

  const minus = time.lastIndexOf('-');
  if (minus !== -1) return time.slice(minus);

  return null;
}

function normalizeTz(tz, date) {
  const offset = getTimezoneOffset(tz, date) / 1000;
  if (isNaN(offset)) return null;

  const sign = offset < 0 ? '-' : '+';
  const hours = Math.floor(Math.abs(offset) / 3600);
  const minutes = Math.floor((Math.abs(offset) % 3600) / 60);
  const seconds = Math.floor(Math.abs(offset) % 60);

  let offsetSuffix = `${sign}${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}`;
  if (seconds !== 0) {
    offsetSuffix += `:${seconds.toString().padStart(2, '0')}`;
  }

  return offsetSuffix;
}

function dateParts(combinedDate, withTz, str, form) {
  let date = combinedDate;
  let tz = null;
  if (form.endsWith('X') && str.endsWith('Z')) {
    tz = '+00:00';
  } else if (form.endsWith('XXX')) {
    const tzm = extractTz(str);
    if (tzm) tz = tzm;
  } else if (form.endsWith('X')) {
    const tzh = extractTz(str);
    if (tzh) tz = `${tzh}:00`;
  } else if (withTz) {
    // no timezone in the format, use provided timezone
    date = zonedTimeToUtc(combinedDate, withTz);
    tz = normalizeTz(tz, date);
  }
  // else: no timezone in the format, using system timezone to parse and no tz in the output

  return {
    plain: date,
    sql: formatISO9075(date),
    sqlDate: format(date, 'yyyy-MM-dd'),
    iso: formatRFC3339(date),
    year: getYear(date),
    month: getMonth(date),
    day: getDate(date),
    hour: getHours(date),
    minute: getMinutes(date),
    second: getSeconds(date),
    tz,
  };
}

export const DATE_OBJECT_SCHEMA = object({
  precision: string()
    .oneOf(Object.values(FHIR_DATETIME_PRECISION))
    .required(),
  plain: yupDate().required(),
  sql: string().required(),
  iso: string().required(),
  value: object({
    year: number().required(),
    month: number().optional(),
    day: number().optional(),
    hour: number().optional(),
    minute: number().optional(),
    second: number().optional(),
    tz: string().optional(),
  }),
}).noUnknown();

const COMMONS = ['plain', 'sql', 'iso'];
const FORMS = {
  "yyyy-MM-dd'T'HH:mm:ssXXX": [
    FHIR_DATETIME_PRECISION.SECONDS_WITH_TIMEZONE,
    ['year', 'month', 'day', 'hour', 'minute', 'second', 'tz'],
  ],
  "yyyy-MM-dd'T'HH:mm:ssX": [
    FHIR_DATETIME_PRECISION.SECONDS_WITH_TIMEZONE,
    ['year', 'month', 'day', 'hour', 'minute', 'second', 'tz'],
  ],
  "yyyy-MM-dd'T'HH:mmXXX": [
    FHIR_DATETIME_PRECISION.MINUTES_WITH_TIMEZONE,
    ['year', 'month', 'day', 'hour', 'minute', 'tz'],
  ],
  "yyyy-MM-dd'T'HH:mmX": [
    FHIR_DATETIME_PRECISION.MINUTES_WITH_TIMEZONE,
    ['year', 'month', 'day', 'hour', 'minute', 'tz'],
  ],
  "yyyy-MM-dd'T'HHXXX": [
    FHIR_DATETIME_PRECISION.HOURS_WITH_TIMEZONE,
    ['year', 'month', 'day', 'hour', 'tz'],
  ],
  "yyyy-MM-dd'T'HHX": [
    FHIR_DATETIME_PRECISION.HOURS_WITH_TIMEZONE,
    ['year', 'month', 'day', 'hour', 'tz'],
  ],
  "yyyy-MM-dd'T'HH:mm:ss": [
    FHIR_DATETIME_PRECISION.SECONDS,
    ['year', 'month', 'day', 'hour', 'minute', 'second'],
  ],
  "yyyy-MM-dd'T'HH:mm": [
    FHIR_DATETIME_PRECISION.MINUTES,
    ['year', 'month', 'day', 'hour', 'minute'],
  ],
  "yyyy-MM-dd'T'HH": [FHIR_DATETIME_PRECISION.HOURS, ['year', 'month', 'day', 'hour']],
  'yyyy-MM-dd': [FHIR_DATETIME_PRECISION.DAYS, ['year', 'month', 'day']],
  'yyyy-MM': [FHIR_DATETIME_PRECISION.MONTHS, ['year', 'month']],
  yyyy: [FHIR_DATETIME_PRECISION.YEARS, ['year']],
};

export function parseDateTime(str, { ref = new Date(), withTz = null } = {}) {
  for (const [form, [precision, extract]] of Object.entries(FORMS)) {
    const date = parse(str, form, ref);
    if (isValid(date)) {
      const parts = dateParts(date, withTz, str, form);
      return {
        // note this is the input precision; when using withTz, the value
        // will include a tz even if the precision isn't *_WITH_TIMEZONE.
        precision,
        ...pick(parts, COMMONS),
        value: pick(parts, extract),
      };
    }
  }

  return false;
}

export function formatFhirDate(date, precision = FHIR_DATETIME_PRECISION.SECONDS_WITH_TIMEZONE) {
  if (date === null || date === undefined) return date;
  const actual = parseDate(date);
  switch (precision) {
    case FHIR_DATETIME_PRECISION.SECONDS_WITH_TIMEZONE:
      return format(actual, "yyyy-MM-dd'T'HH:mm:ssXXX");

    case FHIR_DATETIME_PRECISION.DAYS:
      return format(actual, 'yyyy-MM-dd');

    case FHIR_DATETIME_PRECISION.MONTHS:
      return format(actual, 'yyyy-MM');

    case FHIR_DATETIME_PRECISION.YEARS:
      return format(actual, 'yyyy');

    case FHIR_DATETIME_PRECISION.MINUTES_WITH_TIMEZONE:
    case FHIR_DATETIME_PRECISION.HOURS_WITH_TIMEZONE:
    case FHIR_DATETIME_PRECISION.SECONDS:
    case FHIR_DATETIME_PRECISION.MINUTES:
    case FHIR_DATETIME_PRECISION.HOURS:
      // not allowed under FHIR
      throw new Exception('cannot format to that precision level');

    default:
      throw new Exception(`unknown datetime precision: ${precision}`);
  }
}
