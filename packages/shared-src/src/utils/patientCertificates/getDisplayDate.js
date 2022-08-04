import { format as formatDate } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

const DEFAULT_DATE_FORMAT = 'dd/MM/yyyy';

// Display the date in a configured timezone if one is set
export const getDisplayDate = (date, format = DEFAULT_DATE_FORMAT, getLocalisation) => {
  const timeZone = getLocalisation('timeZone');

  if (timeZone) {
    return formatInTimeZone(date, timeZone, format);
  }

  return formatDate(date, format);
};
