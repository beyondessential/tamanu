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

  const data = await report(db, params);

  const date = moment().format('YYYY-MM-DD');
  const filename = `${date}_${reportName}.xlsx`;

  await writeToExcel(filename, data);

  return {};
};
