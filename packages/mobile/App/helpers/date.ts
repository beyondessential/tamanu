import { format } from 'date-fns';

export function formatDate(date: Date, dateFormat: string) {
  return format(date, dateFormat);
}
