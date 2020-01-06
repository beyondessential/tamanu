import { format } from 'date-fns';

export function formatDate(date: Date, dateFormat: string): string {
  return format(date, dateFormat);
}
