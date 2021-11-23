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

const generateReport = async () => {
  // 1. get models

  console.log('Initialising database');
  const { models } = await initDatabase({
    port: 5431,
    name: 'tamanu-sync',
    verbose: false,
    username: 'tamanu_sync',
    password: 'tamanu_sync_pass',
  });
  console.log('Initialising database: Success!');

  // 2. generate report data
  console.log('Generating report data');
  const data = await dataGenerator(models, {});
  console.log('Generating report data: Success!');

  // 3. convert to excel and write
  console.log('Writing to excel file');
  const folder = path.resolve('data');
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
