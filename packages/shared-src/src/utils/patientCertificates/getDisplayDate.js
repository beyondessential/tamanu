import { format as formatDate } from 'date-fns';

const DEFAULT_DATE_FORMAT = 'dd/MM/yyyy';

export const getDisplayDate = (date, format = DEFAULT_DATE_FORMAT) => {
  const dateObject = date ? new Date(date) : new Date();
  return formatDate(dateObject, format);
};
