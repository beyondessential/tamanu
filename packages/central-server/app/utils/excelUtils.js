import os from 'node:os';
import path from 'node:path';
import * as XLSX from 'xlsx';
import * as fs from 'node:fs';

// xlsx's ESM build does not bind Node's fs automatically, so readFile/writeFile throw
// "cannot save file" unless we wire it up explicitly. Other builds (e.g. the one jest
// resolves) auto-bind fs and don't expose set_fs, so only call it when present.
if (typeof XLSX.set_fs === 'function') {
  XLSX.set_fs(fs);
}

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
