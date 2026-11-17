import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

const loadTmpdir = async mkdtemp => {
  vi.resetModules();
  vi.doMock('node:fs/promises', async () => {
    const actual = await vi.importActual('node:fs/promises');
    return { ...actual, mkdtemp: mkdtemp ?? actual.mkdtemp };
  });
  return import('../../src/utils/tmpdir');
};

describe('uploadDir', () => {
  afterEach(() => {
    vi.doUnmock('node:fs/promises');
    vi.resetModules();
  });

  it('makes the directory once and hands back the same one after that', async () => {
    const { uploadDir, uploadDirPath } = await loadTmpdir();

    const [first, second] = await Promise.all([uploadDir(), uploadDir()]);

    expect(first).toBe(second);
    expect(uploadDirPath()).toBe(first);
    await fs.rm(first, { recursive: true });
  });

  it('tries again after a failure instead of holding on to it', async () => {
    const { mkdtemp: realMkdtemp } = await vi.importActual('node:fs/promises');
    const mkdtemp = vi
      .fn()
      .mockRejectedValueOnce(new Error('ENOSPC: no space left on device'))
      .mockImplementation(prefix => realMkdtemp(prefix));
    const { uploadDir, uploadDirPath } = await loadTmpdir(mkdtemp);

    await expect(uploadDir()).rejects.toThrow('ENOSPC');
    expect(uploadDirPath()).toBeNull();

    const directory = await uploadDir();

    expect(directory).toBe(uploadDirPath());
    expect(path.dirname(directory)).toBe(path.resolve(os.tmpdir()));
    expect(mkdtemp).toHaveBeenCalledTimes(2);
    await fs.rm(directory, { recursive: true });
  });
});
