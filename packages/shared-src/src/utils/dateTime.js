import { isValid, formatISO9075, differenceInMonths, differenceInYears } from 'date-fns';

export function toDateTimeString(date) {
  const dateObj = new Date(date);
  if (!isValid(dateObj)) {
    throw new Error('Not a valid date');
  }
  return formatISO9075(dateObj, { representation: 'complete' });
}

export function toDateString(date) {
  const dateObj = new Date(date);
  if (!isValid(dateObj)) {
    throw new Error('Not a valid date');
  }
  return formatISO9075(dateObj, { representation: 'date' });
}

export function getCurrentDateTimeString() {
  return formatISO9075(new Date());
}

export function getCurrentDateString() {
  return formatISO9075(new Date(), { representation: 'date' });
}

export function ageInMonths(dob) {
  return differenceInMonths(new Date(), new Date(dob));
}

export function ageInYears(dob) {
  return differenceInYears(new Date(), new Date(dob));
}
