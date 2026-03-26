import * as XLSX from 'xlsx';

const stringifyIfNonDateObject = val =>
  typeof val === 'object' && !(val instanceof Date) && val !== null ? JSON.stringify(val) : val;

export function writeExcelFile(sheets, fileName) {
  const workbook = XLSX.utils.book_new();
  sheets.forEach(sheet => {
    const stringifiedData = sheet.data.map(row => row.map(stringifyIfNonDateObject));
    const worksheet = XLSX.utils.aoa_to_sheet(stringifiedData);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  });
  const excelFileName = fileName || `./export-${Date.now()}.xlsx`;
  XLSX.writeFile(workbook, excelFileName);
  return excelFileName;
}
