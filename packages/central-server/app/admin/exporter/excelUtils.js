import xlsx from 'xlsx';

export function writeExcelFile(sheets, fileName) {
  const workbook = xlsx.utils.book_new();
  sheets.forEach(sheet => {
    const worksheet = xlsx.utils.aoa_to_sheet(sheet.data);
    xlsx.utils.book_append_sheet(workbook, worksheet, sheet.name);
  });
  const excelFileName = fileName || `./export-${Date.now()}.xlsx`;
  xlsx.writeFile(workbook, excelFileName);
  return excelFileName;
}
