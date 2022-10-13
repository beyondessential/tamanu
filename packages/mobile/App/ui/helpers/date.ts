import { format, parseISO, differenceInYears, formatISO9075 } from 'date-fns';

export function formatDate(date: Date, dateFormat: string): string {
  return format(date, dateFormat);
}

export function getAgeFromDate(date: string): number {
  return differenceInYears(new Date(), parseISO9075(date));
}

export function formatStringDate(date: string, dateFormat: string): string {
  const dateValue: Date = parseISO(date);
  return formatDate(dateValue, dateFormat);
}

// It seems that some JS implementations have problems
// parsing strings to dates.
export function parseISO9075(date: string): Date {
  return new Date(date.replace(' ', 'T'));
}

export function getCurrentDateTimeString(): string {
  return formatISO9075(new Date());
}
