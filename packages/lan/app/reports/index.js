import { subMonths } from 'date-fns';

import * as allReports from './allReports';

export const getAllReports = async () =>
  Object.entries(allReports).map(([id, { title, parameters }]) => ({
    id,
    title,
    parameters,
  }));

export const generateReport = async (db, reportName, userParams) => {
  const report = allReports[reportName];
  if (!report) {
    throw new Error(`No such report: ${reportName}`);
  }

  const params = {
    startDate: subMonths(userParams.endDate, 1),
    endDate: new Date(),
    ...userParams,
  };

  const data = await report.run(db, params);

  return {
    metadata: {
      report: report.title,
      generated: new Date(),
      ...userParams,
    },
    data,
  };
};
