import fs from 'fs';
import path from 'path';
import { beforeAll, describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import {
  createZippedSpreadsheet,
  removeZippedSpreadsheet,
  toSafeFileName,
} from '../../app/utils/files';

describe('toSafeFileName', () => {
  it('leaves an ordinary name alone', () => {
    expect(toSafeFileName('International Patient Summary for Jane Doe.png')).toBe(
      'International Patient Summary for Jane Doe.png',
    );
  });

  it.each([
    ['../../elsewhere/name', 'elsewherename'],
    ['..\\..\\name.ini', 'name.ini'],
    ['a/b\\c', 'abc'],
    ['name\0.png', 'name.png'],
    ['line\nbreak\ttab\x7f', 'linebreaktab'],
    ['re: <report> "x" | y * z?', 're report x  y  z'],
    ['..', ''],
    ['.hidden', 'hidden'],
    [' .hidden', 'hidden'],
    ['name. ', 'name'],
  ])('turns %j into %j', (input, expected) => {
    expect(toSafeFileName(input)).toBe(expected);
  });

  it('keeps dots within a name', () => {
    expect(toSafeFileName('Dr. J. Smith..png')).toBe('Dr. J. Smith..png');
  });
});

describe('createZippedSpreadsheet', () => {
  const reportData = { data: [['a'], [1]], metadata: [['Report', 'Test']] };

  // The server wires xlsx's file system up at startup.
  beforeAll(() => XLSX.set_fs(fs));

  it('gives each run of the same report its own file', async () => {
    const first = await createZippedSpreadsheet('report-name', reportData, 'csv');
    const second = await createZippedSpreadsheet('report-name', reportData, 'csv');
    try {
      expect(path.basename(first)).toBe('report-name.zip');
      expect(path.basename(second)).toBe('report-name.zip');
      expect(first).not.toBe(second);
      expect(fs.existsSync(first)).toBe(true);
      expect(fs.existsSync(second)).toBe(true);
    } finally {
      await removeZippedSpreadsheet(first);
      await removeZippedSpreadsheet(second);
    }
    expect(fs.existsSync(path.dirname(first))).toBe(false);
    expect(fs.existsSync(path.dirname(second))).toBe(false);
  });
});
