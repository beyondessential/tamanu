/*
 * Tests for saveFile's ordering guarantee: the chosen file must not be opened for writing (which
 * truncates it to zero bytes) until the data has been fetched successfully. Otherwise a failed
 * export — e.g. nothing selected to export — leaves an empty 0 KB file behind.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';

import { saveFile } from '../../app/utils/fileSystemAccess';

const makeFileHandle = () => {
  const writable = {
    write: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    abort: vi.fn().mockResolvedValue(undefined),
  };
  const createWritable = vi.fn().mockResolvedValue(writable);
  return { fileHandle: { createWritable }, writable, createWritable };
};

afterEach(() => vi.unstubAllGlobals());

describe('saveFile', () => {
  it('opens and writes the file only after the data resolves', async () => {
    const { fileHandle, writable, createWritable } = makeFileHandle();
    vi.stubGlobal('showSaveFilePicker', vi.fn().mockResolvedValue(fileHandle));
    const data = new Uint8Array([1, 2, 3]);
    const getData = vi.fn().mockResolvedValue(data);

    const result = await saveFile({ defaultFileName: 'export', getData, extension: 'xlsx' });

    expect(result).toBe(true);
    expect(getData).toHaveBeenCalledTimes(1);
    expect(createWritable).toHaveBeenCalledTimes(1);
    expect(writable.write).toHaveBeenCalledWith(data);
    expect(writable.close).toHaveBeenCalledTimes(1);
  });

  it('does not open the chosen file when the data fetch fails', async () => {
    const { fileHandle, createWritable } = makeFileHandle();
    vi.stubGlobal('showSaveFilePicker', vi.fn().mockResolvedValue(fileHandle));
    const getData = vi.fn().mockRejectedValue(new Error('nothing to export'));

    await expect(
      saveFile({ defaultFileName: 'export', getData, extension: 'xlsx' }),
    ).rejects.toThrow('nothing to export');

    // Never opened for writing, so no empty file is left behind.
    expect(createWritable).not.toHaveBeenCalled();
  });
});
