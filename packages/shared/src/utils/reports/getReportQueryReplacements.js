import { subDays, startOfDay, subYears, addDays, endOfDay, parseISO } from 'date-fns';
import { REPORT_DEFAULT_DATE_RANGES } from '@tamanu/constants';
import { toDateTimeString, getCurrentDateTimeString } from '@tamanu/utils/dateTime';

const START_OF_EPOCH = '1970-01-01 00:00:00';

const getStartDate = (dateRange, { toDate, fromDate }) => {
  if (fromDate) {
    return toDateTimeString(startOfDay(parseISO(fromDate)));
  }
  switch (dateRange) {
    case REPORT_DEFAULT_DATE_RANGES.ALL_TIME:
      return START_OF_EPOCH;
    case REPORT_DEFAULT_DATE_RANGES.EIGHTEEN_YEARS:
      return toDateTimeString(startOfDay(subYears(parseISO(toDate), 18)));
    case REPORT_DEFAULT_DATE_RANGES.THIRTY_DAYS:
      // If we have a toDate, but no fromDate, run 30 days prior to the toDate
      return toDateTimeString(startOfDay(subDays(parseISO(toDate), 30)));
    case REPORT_DEFAULT_DATE_RANGES.SEVEN_DAYS:
      return toDateTimeString(startOfDay(subDays(parseISO(toDate), 7)));
    case REPORT_DEFAULT_DATE_RANGES.TWENTY_FOUR_HOURS:
      return toDateTimeString(subDays(parseISO(toDate), 1));
    case REPORT_DEFAULT_DATE_RANGES.NEXT_THIRTY_DAYS:
      return toDateTimeString(startOfDay(addDays(new Date(), 1)));
    default:
      throw new Error('Unknown date range for report generation');
  }
};

const getEndDate = (dateRange, { toDate, fromDate }) => {
  if (toDate) {
    return toDateTimeString(endOfDay(parseISO(toDate)));
  }
  switch (dateRange) {
    case REPORT_DEFAULT_DATE_RANGES.ALL_TIME:
    case REPORT_DEFAULT_DATE_RANGES.EIGHTEEN_YEARS:
    case REPORT_DEFAULT_DATE_RANGES.THIRTY_DAYS:
    case REPORT_DEFAULT_DATE_RANGES.SEVEN_DAYS:
    case REPORT_DEFAULT_DATE_RANGES.TWENTY_FOUR_HOURS:
      return getCurrentDateTimeString();
    case REPORT_DEFAULT_DATE_RANGES.NEXT_THIRTY_DAYS:
      return toDateTimeString(
        endOfDay(addDays(fromDate ? parseISO(fromDate) : addDays(new Date(), 1), 30)),
      );
    default:
      throw new Error('Unknown date range for report generation');
  }
};

export const getReportQueryReplacements = async (
  paramDefinitions,
  facilityId,
  params = {},
  dateRange = REPORT_DEFAULT_DATE_RANGES.TWENTY_FOUR_HOURS,
) => {
  const paramDefaults = paramDefinitions.reduce((obj, { name }) => ({ ...obj, [name]: null }), {});
  console.log({
    fromDate: getStartDate(dateRange, params),
    toDate: getEndDate(dateRange, params),
  });
  return {
    ...paramDefaults,
    ...params,
    fromDate: getStartDate(dateRange, params),
    toDate: getEndDate(dateRange, params),
    currentFacilityId: facilityId,
  };
};
