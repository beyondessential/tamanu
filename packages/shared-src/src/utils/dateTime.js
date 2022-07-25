import { isValid, formatISO9075 } from 'date-fns';

export function toDateTimeString(date) {
  if (!isValid(date)) {
    throw new Error('Not a valid date');
  }
  return formatISO9075(date);
}
