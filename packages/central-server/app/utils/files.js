import fs from 'fs';
import os from 'os';
import path from 'path';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

import { tmpdir } from '@tamanu/shared/utils';

const ATTACHMENT_DIRECTORY_NAME = 'tamanu-email-attachments';

const attachmentDirPath = () => path.join(path.resolve(os.tmpdir()), ATTACHMENT_DIRECTORY_NAME);

/**
 * The directory central writes the files it generates for sending, such as certificates. It is
 * kept apart from the rest of the temp directory so that no other file central writes there, a
 * report spreadsheet for example, can be taken for an attachment.
 */
export async function attachmentDir() {
  const dir = attachmentDirPath();
  await fs.promises.mkdir(dir, { recursive: true, mode: 0o700 });
  return dir;
}

/**
 * Whether a path is a file central generated for sending, which it writes into its attachment
 * directory. A path anywhere else was not generated for sending and must not be read or removed.
 * The temp directory is shared with other accounts on the host, so a file there also has to be a
 * regular file this process's account owns, not a link or a file someone else left there.
 */
export async function isGeneratedFile(filePath) {
  if (path.dirname(path.resolve(filePath)) !== attachmentDirPath()) return false;

  try {
    const stats = await fs.promises.lstat(filePath);
    // Windows has no owning uid, and its temp directory is per-account already
    const isOwnedByUs = process.getuid === undefined || stats.uid === process.getuid();
    return stats.isFile() && isOwnedByUs;
  } catch {
    return false;
  }
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
    XLSX.writeFileAsync(filePath, book, { bookType, type: 'buffer' }, err => {
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
