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
import { pick } from 'lodash';
import { date, number, object, string } from 'yup';
import { FHIR_DATETIME_PRECISION } from 'shared/constants';

function extractTz(str) {
  const [_date, time] = str.split('T');

  const plus = time.lastIndexOf('+');
  if (plus !== -1) return time.slice(plus);

  const minus = time.lastIndexOf('-');
  if (minus !== -1) return time.slice(minus);

  return null;
}

function dateParts(date, str, form) {
  let tz = null;
  if (form.endsWith('X') && str.endsWith('Z')) {
    tz = '+00:00';
  } else if (form.endsWith('XXX')) {
    const tzm = extractTz(str);
    if (tzm) tz = tzm;
  } else if (form.endsWith('X')) {
    const tzh = extractTz(str);
    if (tzh) tz = `${tzh}:00`;
  }

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
  plain: date().required(),
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

export function parseDateTime(str, ref = new Date()) {
  for (const [form, [precision, extract]] of Object.entries(FORMS)) {
    const date = parse(str, form, ref);
    if (isValid(date)) {
      const parts = dateParts(date, str, form);
      return {
        precision,
        ...pick(parts, COMMONS),
        value: pick(parts, extract),
      };
    }
  }

  return false;
}
