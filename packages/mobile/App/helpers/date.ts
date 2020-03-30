import { format, differenceInCalendarYears } from 'date-fns';

export function formatDate(date: Date, dateFormat: string): string {
  return format(date, dateFormat);
}

export function getAgeFromDate(date: Date): number {
  return Math.abs(differenceInCalendarYears(date, new Date()));
}
