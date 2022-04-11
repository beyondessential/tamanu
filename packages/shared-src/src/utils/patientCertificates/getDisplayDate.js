import config from 'config';
import moment from 'moment-timezone';
import { log } from 'shared/services/logging';

const DEFAULT_DATE_FORMAT = 'DD/MM/YYYY';

// Display the date in a configured timezone if one is set
export const getDisplayDate = (date, format = DEFAULT_DATE_FORMAT) => {
  const timeZone = config?.localisation?.data?.timeZone;

  if (timeZone) {
    log.debug(`Display date: ${date} with configured time zone: ${timeZone}.`);

    return moment(date)
      .tz(timeZone)
      .format(format);
  }

  return moment(date).format(format);
};
