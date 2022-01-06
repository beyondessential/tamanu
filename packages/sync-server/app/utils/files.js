import os from 'os';
import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import XLSX from 'xlsx';
import JSZip from 'jszip';

// on windows, os.tmpdir() can return a non-existent folder
async function tmpdir() {
  const dir = path.resolve(os.tmpdir());
  await mkdirp(dir);
  return dir;
}

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

export async function createZipFromFile(fileName, filePath, zipFilePath) {
  const encoding = 'base64';
  const fileContent = await fs.promises.readFile(filePath);
  const zip = new JSZip();
  //write the file into zip
  zip.file(fileName, fileContent);
  const zipContent = await zip.generateAsync({
    type: encoding,
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });
  await fs.promises.writeFile(zipFilePath, zipContent, { encoding });
}

export async function createZippedExcelFile(reportName, data) {
  const folder = await tmpdir();
  const excelFileName = `${reportName}.xlsx`;
  const excelFilePath = path.join(folder, excelFileName);
  const zipFilePath = path.join(folder, `${reportName}.zip`);
  await writeExcelFile(data, excelFilePath);
  await createZipFromFile(excelFileName, excelFilePath, zipFilePath);
  await removeFile(excelFilePath);
  return zipFilePath;
}
