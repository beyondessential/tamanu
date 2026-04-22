import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as XLSX from 'xlsx';

import { log } from '@tamanu/shared/services/logging';

/** Arbitrary subfolder name. Reverse-DNS format not technically important, just ergonomic. */
const dirname = path.resolve(os.tmpdir(), 'app.tamanu.central');

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
  fs.mkdirSync(dirname, { recursive: true });
  const fullPath = path.join(dirname, basename);

  XLSX.writeFile(workbook, fullPath);
  log.info(`Wrote file ${fullPath}`);

  return fullPath;
}
