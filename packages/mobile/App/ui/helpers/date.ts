import { format, parseISO, differenceInYears } from 'date-fns';
import { DateString } from '~/types';

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

// It seems that some JS implementations have problems
// parsing strings to dates.
export function parseISO9075(date: string): Date {
  return new Date(date.replace(' ', 'T'));
}
