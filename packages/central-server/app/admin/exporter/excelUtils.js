import * as XLSX from 'xlsx';

export function writeExcelFile(sheets, fileName) {
  const workbook = XLSX.utils.book_new();
  sheets.forEach(sheet => {
    const worksheet = XLSX.utils.aoa_to_sheet(sheet.data);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  });
  const excelFileName = fileName || `./export-${Date.now()}.xlsx`;
  XLSX.writeFile(workbook, excelFileName);
  return excelFileName;
}
