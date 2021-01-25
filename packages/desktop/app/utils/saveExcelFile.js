import XLSX from 'xlsx';
import { showFileDialog } from './dialog';

const xlsxFilters = [{ name: 'Excel spreadsheet (.xlsx)', extensions: ['xlsx'] }];

export async function saveExcelFile(data, { promptForFilePath, filePath, defaultFileName }) {
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
  const book = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(book, sheet, 'values');
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
