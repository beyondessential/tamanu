import { formatISO9075 } from 'date-fns';

export function toDateTimeString(date) {
  return formatISO9075(new Date(date));
}
