/**
 * NOTE:
 *
 * This is not the recommended way to generate reports, and will be removed in the future:
 *
 * https://linear.app/bes/issue/TAN-1029/remove-generate-report-script-and-allow-sync-server-report-subcommand
 *
 * Please use the sync server report subcommand if you don't need to download to excel locally.
 */

const reportName = 'covid-swab-lab-test-list';

const path = require('path');
const XLSX = require('xlsx');

const { initDatabase } = require('shared/services/database');
// eslint-disable-next-line import/no-dynamic-require
const { dataGenerator } = require(`shared/reports/${reportName}`);

async function writeExcelFile(data, filePath) {
  const book = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(book, sheet, 'values');
  return new Promise((resolve, reject) => {
    XLSX.writeFileAsync(filePath, book, null, err => {
      if (err) {
        reject(err);
      } else {
        resolve(filePath);
      }
    });
  });
}

// These are the params that will be passed to the report builder
// The below are just examples of params - remember to use id 
// when referencing
const parameters = {
  // fromDate: '2021-03-15',
  // toDate: '2021-11-18',
  // village: 'ref/village/AELE',
  // diagnosis: 'ref/icd10/B40.9',
};

const generateReport = async () => {
  // 1. get models
  console.log('Initialising database');

  // Make sure to edit these to be your own connection details
  const context = await initDatabase({
    port: 5431,
    name: 'tamanu-sync',
    verbose: false,
    username: '',
    password: '',
  });
  console.log('Initialising database: Success!');

  // 2. generate report data
  console.log('Generating report data');
  const data = await dataGenerator(context, parameters);
  console.log('Generating report data: Success!');

  // 3. convert to excel and write
  console.log('Writing to excel file');
  const folder = path.resolve('packages/sync-server/data');
  const excelFileName = `${reportName}-${new Date().toString()}.xlsx`;
  const excelFilePath = path.join(folder, excelFileName);
  await writeExcelFile(data, excelFilePath);
  console.log('Writing to excel file: Success!');
};

(async () => {
  await generateReport();
})()
  .then(() => {
    console.log('success!');
  })
  .catch(e => {
    console.error('caught error, stopping...');
    throw e;
  });
