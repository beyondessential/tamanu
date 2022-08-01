import { formatISO9075 } from 'date-fns';

export function getCurrentDateTimeString() {
  return formatISO9075(new Date());
}

export function getCurrentDateString() {
  return formatISO9075(new Date(), { representation: 'date' });
}

export function toDateTimeString(date) {
  return formatISO9075(new Date(date));
}
