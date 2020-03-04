import moment from 'moment';

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
    throw new Error('No such report');
  }

  const params = {
    startDate: moment(userParams.endDate)
      .subtract(1, 'month')
      .toDate(),
    endDate: moment().toDate(),
    ...userParams,
  };

  const data = await report.run(db, params);

  // const date = moment().format('YYYY-MM-DD');
  // const filename = `${date}_${reportName}.xlsx`;

  // await writeToExcel(filename, data);

  return {
    metadata: {
      report: report.title,
      generated: moment().toDate(),
      ...userParams,
    },
    data,
  };
};
