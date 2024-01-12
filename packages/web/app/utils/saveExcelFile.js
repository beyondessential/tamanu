import XLSX from 'xlsx';
import { createFileSystemHandle } from './fileSystemAccess';

const stringifyIfNonDateObject = val =>
  typeof val === 'object' && !(val instanceof Date) && val !== null ? JSON.stringify(val) : val;

export async function saveExcelFile({ data, metadata, defaultFileName = '', bookType }) {
  const stringifiedData = data.map(row => row.map(stringifyIfNonDateObject));

  const book = XLSX.utils.book_new();
  const metadataSheet = XLSX.utils.aoa_to_sheet(metadata);
  metadataSheet['!cols'] = [{ wch: 30 }, { wch: 30 }];

  const dataSheet = XLSX.utils.aoa_to_sheet(stringifiedData);
  // For csv bookTypes, only the first sheet will be exported as CSV book types don't support
  // multiple tabs
  XLSX.utils.book_append_sheet(book, dataSheet, 'report');
  XLSX.utils.book_append_sheet(book, metadataSheet, 'metadata');

  const fileHandle = await createFileSystemHandle({
    defaultFileName,
    extensions: [bookType],
  });

  const writable = await fileHandle.createWritable();

  const xlsxDataArray = XLSX.write(book, { bookType, type: 'array' });

  await writable.write(xlsxDataArray);
  await writable.close();
}
