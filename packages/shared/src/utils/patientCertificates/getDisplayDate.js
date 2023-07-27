import { formatInTimeZone } from 'date-fns-tz';
import { format as formatDate } from '../dateTime';

const DEFAULT_DATE_FORMAT = 'dd/MM/yyyy';

export const getDisplayDate = (date, format = DEFAULT_DATE_FORMAT, getLocalisation) => {
  // Format the date if it's passed in
  if (date) {
    return formatDate(date, format);
  }

  // Display the current date in a configured timezone if one is set
  if (getLocalisation && getLocalisation('timeZone')) {
    return formatInTimeZone(new Date(), getLocalisation('timeZone'), format);
  }

  // Finally return a current date
  return formatDate(new Date(), format);
};
