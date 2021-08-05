import moment from 'moment';

import * as allReports from './allReports';

export const getAllReports = async () =>
  Object.entries(allReports).map(([id, { title, parameters }]) => ({
    id,
    title,
    parameters,
  }));

/**
 * @param db
 * @param reportName string
 * @param userParams {}
 * @param otherConfig {} extra report config not provided by user
 * @returns {Promise<*>}
 */
export const generateReport = async (db, reportName, userParams, otherConfig) => {
  const report = allReports[reportName];
  if (!report) {
    throw new Error(`No such report: ${reportName}`);
  }

  const params = {
    startDate: moment(userParams.endDate)
      .subtract(1, 'month')
      .toDate(),
    endDate: moment().toDate(),
    ...userParams,
  };

  const data = await report.run(db, params, otherConfig);

  return {
    metadata: {
      report: report.title,
      generated: moment().toDate(),
      ...userParams,
    },
    data,
  };
};
