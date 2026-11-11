import * as XLSX from 'xlsx';
import * as fs from 'node:fs';

// xlsx's ESM build does not bind Node's fs automatically, so readFile/writeFile throw
// "cannot save file" unless we wire it up explicitly. Its other builds auto-bind fs and
// don't expose set_fs, so only call it when present.
if (typeof XLSX.set_fs === 'function') {
  XLSX.set_fs(fs);
}

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

const EXCEL_EPOCH = Date.UTC(1899, 11, 30);
const SECONDS_IN_DAY = 24 * 60 * 60;

// An Excel date is the wall-clock time as days since 1899-12-30, with no timezone. Rebuild that
// wall-clock time in local time, which is how the exporter wrote it and how the models format it.
export function getDateFromExcel(excelDate) {
  const days = Number(excelDate);
  if (!Number.isFinite(days)) {
    throw new Error(`Unrecognised date "${excelDate}", expected an Excel date`);
  }
  const wallClock = new Date(EXCEL_EPOCH + Math.round(days * SECONDS_IN_DAY) * 1000);
  return new Date(
    wallClock.getUTCFullYear(),
    wallClock.getUTCMonth(),
    wallClock.getUTCDate(),
    wallClock.getUTCHours(),
    wallClock.getUTCMinutes(),
    wallClock.getUTCSeconds(),
  );
}
