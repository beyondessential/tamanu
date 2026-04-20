import os from 'node:os';
import path from 'node:path';
import * as XLSX from 'xlsx';

import { log } from '@tamanu/shared/services/logging';

const stringifyIfNonDateObject = val =>
  typeof val === 'object' && !(val instanceof Date) && val !== null ? JSON.stringify(val) : val;

export function writeExcelFile(sheets, fileName) {
  const workbook = XLSX.utils.book_new();
  sheets.forEach(sheet => {
    const stringifiedData = sheet.data.map(row => row.map(stringifyIfNonDateObject));
    const worksheet = XLSX.utils.aoa_to_sheet(stringifiedData);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  });
  const basename = fileName || `export-${Date.now()}.xlsx`;
  const filename = path.join(os.tmpdir(), basename);
  XLSX.writeFile(workbook, filename);
  log.info(`Wrote file ${filename}`);
  return filename;
}
