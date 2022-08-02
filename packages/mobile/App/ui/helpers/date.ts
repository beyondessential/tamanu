import { format, parseISO, differenceInYears, isValid, formatISO9075 } from 'date-fns';

export function formatDate(date: Date, dateFormat: string): string {
  return format(date, dateFormat);
}

export function getAgeFromDate(date: Date): number {
  return differenceInYears(new Date(), new Date(date));
}

export function formatStringDate(date: string, dateFormat: string): string {
  const dateValue: Date = parseISO(date); 
  return formatDate(dateValue, dateFormat);
}

/*
  toDateTimeString, getCurrentDateTimeString and getCurrentDateString
  were created to handle dates as a string type. These are ported from desktop
  see https://github.com/beyondessential/tamanu/pull/2501/files
*/
export function toDateTimeString(date: string):string {
  const dateObj = new Date(date);
  if (!isValid(dateObj)) {
    throw new Error('Not a valid date');
  }
  return formatISO9075(dateObj);
}

export function getCurrentDateTimeString(): string {
  return formatISO9075(new Date());
}

export function getCurrentDateString(): string {
  return formatISO9075(new Date(), { representation: 'date' });
}

// It seems that some JS implementations have problems
// parsing strings to dates.
export function parseISO9075(date: string): Date {
  return new Date(date.replace(' ', 'T'));
}
