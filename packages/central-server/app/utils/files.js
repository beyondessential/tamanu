import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import JSZip from 'jszip';

import { tmpdir } from '@tamanu/shared/utils';

export function removeFile(filePath) {
  return new Promise(resolve => {
    fs.unlink(filePath, err => {
      if (err) {
        resolve([undefined, err]);
      } else {
        resolve([]);
      }
    });
  });
}

const stringifyIfNonDateObject = val =>
  typeof val === 'object' && !(val instanceof Date) && val !== null ? JSON.stringify(val) : val;

export async function writeToSpreadsheet({ data, metadata }, filePath, bookType) {
  const book = XLSX.utils.book_new();
  const metadataSheet = XLSX.utils.aoa_to_sheet(metadata);
  metadataSheet['!cols'] = [{ wch: 30 }, { wch: 30 }];
  const stringifiedData = data.map(row => row.map(stringifyIfNonDateObject));
  const sheet = XLSX.utils.aoa_to_sheet(stringifiedData);

  // For csv bookTypes, only the first sheet will be exported
  XLSX.utils.book_append_sheet(book, sheet, 'report');
  XLSX.utils.book_append_sheet(book, metadataSheet, 'metadata');

  return new Promise((resolve, reject) => {
    XLSX.writeFileAsync(filePath, book, { type: bookType }, err => {
      if (err) {
        reject(err);
      } else {
        resolve(filePath);
      }
    });
  });
}

export async function createZipFromFile(fileName, filePath, zipFilePath) {
  const encoding = 'base64';
  const fileContent = await fs.promises.readFile(filePath);
  const zip = new JSZip();
  // write the file into zip
  zip.file(fileName, fileContent);
  const zipContent = await zip.generateAsync({
    type: encoding,
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });
  await fs.promises.writeFile(zipFilePath, zipContent, { encoding });
}

// Dev note: if you find yourself adding new arguments to this function, it's time to refactor it to take an options object
export async function createZippedSpreadsheet(reportName, data, bookType = 'xlsx') {
  const folder = await tmpdir();
  const excelFileName = `${reportName}.${bookType}`;
  const excelFilePath = path.join(folder, excelFileName);
  const zipFilePath = path.join(folder, `${reportName}.zip`);
  await writeToSpreadsheet(data, excelFilePath, bookType);
  await createZipFromFile(excelFileName, excelFilePath, zipFilePath);
  await removeFile(excelFilePath);
  return zipFilePath;
}
