import { subDays, startOfDay, subYears, addDays, endOfDay, parseISO } from 'date-fns';
import { REPORT_DEFAULT_DATE_RANGES } from '@tamanu/constants';

const CATCH_ALL_FROM_DATE = '1970-01-01';

function getStartDate(dateRange, endDate) {
  switch (dateRange) {
    case REPORT_DEFAULT_DATE_RANGES.ALL_TIME:
      return new Date(CATCH_ALL_FROM_DATE);
    case REPORT_DEFAULT_DATE_RANGES.EIGHTEEN_YEARS:
      return startOfDay(subYears(endDate, 18));
    case REPORT_DEFAULT_DATE_RANGES.THIRTY_DAYS:
      // If we have a toDate, but no fromDate, run 30 days prior to the toDate
      return startOfDay(subDays(endDate, 30));
    case REPORT_DEFAULT_DATE_RANGES.SEVEN_DAYS:
      return startOfDay(subDays(endDate, 7));
    case REPORT_DEFAULT_DATE_RANGES.TWENTY_FOUR_HOURS:
      return subDays(endDate, 1);
    case REPORT_DEFAULT_DATE_RANGES.NEXT_THIRTY_DAYS:
      return new Date();
    default:
      throw new Error('Unknown date range for report generation');
  }
}

function getEndDate(dateRange, fromDate) {
  switch (dateRange) {
    case REPORT_DEFAULT_DATE_RANGES.ALL_TIME:
    case REPORT_DEFAULT_DATE_RANGES.EIGHTEEN_YEARS:
    case REPORT_DEFAULT_DATE_RANGES.THIRTY_DAYS:
    case REPORT_DEFAULT_DATE_RANGES.SEVEN_DAYS:
    case REPORT_DEFAULT_DATE_RANGES.TWENTY_FOUR_HOURS:
      return new Date();
    case REPORT_DEFAULT_DATE_RANGES.NEXT_THIRTY_DAYS:
      return endOfDay(addDays(fromDate || new Date(), 30));
    default:
      throw new Error('Unknown date range for report generation');
  }
}

export const getReportQueryReplacements = async (
  paramDefinitions,
  facilityId,
  params = {},
  dateRange = REPORT_DEFAULT_DATE_RANGES.TWENTY_FOUR_HOURS,
) => {
  let toDate;
  if (params.toDate) {
    toDate = new Date(params.toDate);
  } else {
    toDate = getEndDate(dateRange, params.fromDate ? new Date(params.fromDate) : new Date());
  }

  const fromDate = params.fromDate ? parseISO(params.fromDate) : getStartDate(dateRange, toDate);
  const paramDefaults = paramDefinitions.reduce((obj, { name }) => ({ ...obj, [name]: null }), {});
  return {
    ...paramDefaults,
    ...params,
    currentFacilityId: facilityId,
    fromDate,
    toDate,
  };
};
