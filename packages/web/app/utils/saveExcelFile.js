import XLSX from 'xlsx';

const stringifyIfNonDateObject = val =>
  typeof val === 'object' && !(val instanceof Date) && val !== null ? JSON.stringify(val) : val;

export async function saveExcelFile(
  { data, metadata },
  { promptForFilePath, filePath, defaultFileName = '', bookType },
) {
  let path;
  if (promptForFilePath) {
    // TODO(web)
    // path = await showFileDialog(
    //   [{ name: `Excel spreadsheet (${bookType})`, extensions: [bookType] }],
    //   defaultFileName,
    // );
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
  // For csv bookTypes, only the first sheet will be exported as CSV book types don't support
  // multiple tabs
  XLSX.utils.book_append_sheet(book, dataSheet, 'report');
  XLSX.utils.book_append_sheet(book, metadataSheet, 'metadata');

  return new Promise((resolve, reject) => {
    XLSX.writeFileAsync(path, book, { type: bookType }, err => {
      if (err) {
        reject(err);
      } else {
        resolve(path);
      }
    });
  });
}
