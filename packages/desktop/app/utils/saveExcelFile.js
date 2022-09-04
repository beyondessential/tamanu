import XLSX from 'xlsx';
import { showFileDialog } from './dialog';

const xlsxFilters = [{ name: 'Excel spreadsheet (.xlsx)', extensions: ['xlsx'] }];

const stringifyIfNonDateObject = val =>
  typeof val === 'object' && !(val instanceof Date) && val !== null ? JSON.stringify(val) : val;

export async function saveExcelFile(
  { data, metadata },
  { promptForFilePath, filePath, defaultFileName },
) {
  let path;
  if (promptForFilePath) {
    path = await showFileDialog(xlsxFilters, defaultFileName || '');
    if (!path) {
      // user cancelled
      return '';
    }
  } else {
    path = filePath;
  }
  if (!path) {
    throw Error('No path found');
  }
  const stringifiedData = data.map(row => row.map(stringifyIfNonDateObject));

  const book = XLSX.utils.book_new();
  const metadataSheet = XLSX.utils.aoa_to_sheet(metadata);
  metadataSheet['!cols'] = [{ wch: 30 }, { wch: 30 }];

  const dataSheet = XLSX.utils.aoa_to_sheet(stringifiedData);
  XLSX.utils.book_append_sheet(book, metadataSheet, 'metadata');
  XLSX.utils.book_append_sheet(book, dataSheet, 'report');

  return new Promise((resolve, reject) => {
    XLSX.writeFileAsync(path, book, null, err => {
      if (err) {
        reject(err);
      } else {
        resolve(path);
      }
    });
  });
}
