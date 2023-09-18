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

  const yearPlural = years !== 1 ? 's' : '';
  const monthPlural = months !== 1 ? 's' : '';

  if (!years) {
    return `${months} month${monthPlural}`;
  }
  return `${years} year${yearPlural}, ${months} month${monthPlural}`;
}

export function formatStringDate(date: string, dateFormat: string): string {
  if (!date) {
    return '';
  }

  const dateValue: Date = parseISO(date);
  return formatDate(dateValue, dateFormat);
}

export function getCurrentDateTimeString(): string {
  return formatISO9075(new Date());
}

export function getCombinedDateString(date: Date, time: Date): string {
  return formatISO9075(
    new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      time.getHours(),
      time.getMinutes(),
      time.getSeconds(),
      time.getMilliseconds(),
    ),
  );
}
