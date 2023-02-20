import { format, parseISO, differenceInYears, differenceInMonths, formatISO9075 } from 'date-fns';

export function formatDate(date: Date, dateFormat: string): string {
  return format(date, dateFormat);
}

export function getAgeFromDate(date: string): number {
  return differenceInYears(new Date(), parseISO(date));
}

export function getAgeWithMonthsFromDate(date: string): string {
  const years = differenceInYears(new Date(), parseISO(date));
  const months = differenceInMonths(new Date(), parseISO(date)) - years * 12;
  return `${years} years, ${months} months`;
}

export function formatStringDate(date: string, dateFormat: string): string {
  const dateValue: Date = parseISO(date);
  return formatDate(dateValue, dateFormat);
}

export function getCurrentDateTimeString(): string {
  return formatISO9075(new Date());
}
