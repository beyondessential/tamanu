import { subDays, startOfDay } from 'date-fns';
import { REPORT_DEFAULT_DATE_RANGES } from '../../constants';

const CATCH_ALL_FROM_DATE = '1970-01-01';

function getStartDate(dateRange, endDate) {
  switch (dateRange) {
    case REPORT_DEFAULT_DATE_RANGES.ALL_TIME:
      return new Date(CATCH_ALL_FROM_DATE);
    case REPORT_DEFAULT_DATE_RANGES.THIRTY_DAYS:
      // If we have a toDate, but no fromDate, run 30 days prior to the toDate
      return startOfDay(subDays(endDate, 30));
    default:
      throw new Error('Unknown date range for report generation');
  }
}

export const getReportQueryReplacements = async (
  context,
  paramDefinitions,
  params = {},
  dateRange = REPORT_DEFAULT_DATE_RANGES.ALL_TIME,
) => {
  const { LocalSystemFact } = context.models;
  const currentFacilityId = (await LocalSystemFact.get('facilityId')) || null;

  const toDate = params.toDate ? new Date(params.toDate) : new Date();
  const fromDate = getStartDate(dateRange, toDate);
  const paramDefaults = paramDefinitions.reduce((obj, { name }) => ({ ...obj, [name]: null }), {});
  return {
    ...paramDefaults,
    ...params,
    currentFacilityId,
    fromDate,
    toDate,
  };
};
