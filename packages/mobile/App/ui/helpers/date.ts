import { format, parseISO, differenceInYears } from 'date-fns';

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
