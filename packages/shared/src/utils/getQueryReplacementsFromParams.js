import { subDays, startOfDay } from 'date-fns';
import { REPORT_DEFAULT_DATE_RANGES } from '../constants';

const CATCH_ALL_FROM_DATE = '1970-01-01';

export const getQueryReplacementsFromParams = (
  paramDefinitions,
  params = {},
  dateRange = REPORT_DEFAULT_DATE_RANGES.ALL_TIME,
) => {
  let fromDate = null;
  switch (dateRange) {
    case REPORT_DEFAULT_DATE_RANGES.ALL_TIME:
      fromDate = new Date(CATCH_ALL_FROM_DATE);
      break;
    case REPORT_DEFAULT_DATE_RANGES.THIRTY_DAYS:
      // If we have a toDate, but no fromDate, run 30 days prior to the toDate
      fromDate = startOfDay(subDays(params.toDate ? new Date(params.toDate) : new Date(), 30));
      break;
    default:
      throw new Error('Unknown date range for report generation');
  }
  const paramDefaults = paramDefinitions.reduce((obj, { name }) => ({ ...obj, [name]: null }), {
    fromDate,
    toDate: new Date(),
  });
  return { ...paramDefaults, ...params };
};
