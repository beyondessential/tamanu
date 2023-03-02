import { format, parseISO, differenceInYears, intervalToDuration, formatISO9075 } from 'date-fns';

export function formatDate(date: Date, dateFormat: string): string {
  return format(date, dateFormat);
}

export function getAgeFromDate(date: string): number {
  return differenceInYears(new Date(), parseISO(date));
}

export function getAgeWithMonthsFromDate(date: string): string {
  const { months, years } = intervalToDuration({
    start: parseISO(date),
    end: new Date(),
  });
  if (!years) {
    return `${months} month${months !== 1 ? 's' : ''}`;
  }
  return `${years} years, ${months} month${months !== 1 ? 's' : ''}`;
}

export function formatStringDate(date: string, dateFormat: string): string {
  const dateValue: Date = parseISO(date);
  return formatDate(dateValue, dateFormat);
}

export function getCurrentDateTimeString(): string {
  return formatISO9075(new Date());
}
