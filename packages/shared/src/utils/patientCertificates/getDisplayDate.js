import { formatInTimeZone } from 'date-fns-tz';
import { format as formatDate } from '../dateTime';

const DEFAULT_DATE_FORMAT = 'dd/MM/yyyy';

export const getDisplayDate = (date, format = DEFAULT_DATE_FORMAT, timeZone = null) => {
  // Format the date if it's passed in
  if (date) {
    return formatDate(date, format);
  }

  // Display the current date in a configured timezone if one is set
  if (timeZone) {
    return formatInTimeZone(new Date(), timeZone, format);
  }

  // Finally return a current date
  return formatDate(new Date(), format);
};
