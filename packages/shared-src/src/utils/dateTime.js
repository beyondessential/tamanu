import { isValid, formatISO9075, format } from 'date-fns';

export function toDateTimeString(date) {
  const dateObj = new Date(date);
  if (!isValid(dateObj)) {
    throw new Error('Not a valid date');
  }
  return formatISO9075(dateObj);
}

export function getCurrentDateTimeString() {
  return formatISO9075(new Date());
}

export function getCurrentDateString() {
  return formatISO9075(new Date(), { representation: 'date' });
}

export function convertISO9075toRFC3339(dateString) {
  return format(new Date(dateString), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
}
