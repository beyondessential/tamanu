import XLSX from 'xlsx';
import moment from 'moment';

import * as allReports from './allReports';

const tabulate = ({ headers, rowData }) => [
  headers,
  ...rowData.map(row => headers.map(h => row[h])),
];

const writeToExcel = async (path, data) => {
  const sheet = XLSX.utils.aoa_to_sheet(tabulate(data));

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'values');

  XLSX.writeFile(book, path);
};

export const getAllReports = async () => {
  return Object.entries(allReports)
    .map(([id, { title, parameters }]) => ({ id, title, parameters }));
};

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
