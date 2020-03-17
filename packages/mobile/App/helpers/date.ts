import { format, differenceInDays } from 'date-fns';

export function formatDate(date: Date, dateFormat: string): string {
  return format(date, dateFormat);
}


export function compareDate(dateStart: Date, dateEnd: Date): boolean {
  return differenceInDays(dateStart, dateEnd) === 0;
}
