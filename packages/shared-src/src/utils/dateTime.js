import { isValid, formatISO9075 } from 'date-fns';

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
