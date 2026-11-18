import { spawnSync } from 'node:child_process';
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

  it("names the directory after this process's id", async () => {
    const { uploadDir } = await loadTmpdir();

    const directory = await uploadDir();

    expect(path.basename(directory)).toMatch(new RegExp(`^tamanu-uploads-${process.pid}-`));
    await fs.rm(directory, { recursive: true });
  });

  it('makes the directory once and hands back the same one after that', async () => {
    const { uploadDir, uploadDirPath } = await loadTmpdir();

    const [first, second] = await Promise.all([uploadDir(), uploadDir()]);

    expect(first).toBe(second);
    expect(uploadDirPath()).toBe(first);
    await fs.rm(first, { recursive: true });
  });

  it('makes another when the one it had has been removed', async () => {
    const { uploadDir, uploadDirPath } = await loadTmpdir();
    const first = await uploadDir();
    await fs.rm(first, { recursive: true });

    const second = await uploadDir();

    expect(second).not.toBe(first);
    expect(uploadDirPath()).toBe(second);
    await expect(fs.stat(second)).resolves.toBeTruthy();
    await fs.rm(second, { recursive: true });
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

describe('sweepStaleUploadDirs', () => {
  const made = [];

  // A process that has run and exited, so its id belongs to nothing running.
  const deadPid = () => spawnSync(process.execPath, ['-e', '']).pid;

  const makeUploadDirectory = async pid => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), `tamanu-uploads-${pid}-`));
    await fs.writeFile(path.join(directory, 'upload.pdf'), 'patient document');
    made.push(directory);
    return directory;
  };

  const exists = directory =>
    fs.lstat(directory).then(
      () => true,
      () => false,
    );

  afterEach(async () => {
    vi.doUnmock('node:fs/promises');
    vi.resetModules();
    await Promise.all(made.splice(0).map(directory => fs.rm(directory, { recursive: true, force: true })));
  });

  it('removes a directory left by a process that is no longer running', async () => {
    const { sweepStaleUploadDirs } = await loadTmpdir();
    const stale = await makeUploadDirectory(deadPid());

    await sweepStaleUploadDirs();

    expect(await exists(stale)).toBe(false);
  });

  it('removes a directory with our id that is not the one we hold', async () => {
    const { sweepStaleUploadDirs, uploadDir } = await loadTmpdir();
    const current = await uploadDir();
    made.push(current);
    const leftByEarlierProcess = await makeUploadDirectory(process.pid);

    await sweepStaleUploadDirs();

    expect(await exists(leftByEarlierProcess)).toBe(false);
    expect(await exists(current)).toBe(true);
  });

  it('keeps the directory of another process that is still running', async () => {
    const { sweepStaleUploadDirs } = await loadTmpdir();
    const live = await makeUploadDirectory(process.ppid);

    await sweepStaleUploadDirs();

    expect(await exists(live)).toBe(true);
  });

  it('leaves a link under an upload directory name, and what it points at, alone', async () => {
    const { sweepStaleUploadDirs } = await loadTmpdir();
    const target = await fs.mkdtemp(path.join(os.tmpdir(), 'not-an-upload-'));
    made.push(target);
    await fs.writeFile(path.join(target, 'keep.txt'), 'keep');
    const link = path.join(os.tmpdir(), `tamanu-uploads-${deadPid()}-link`);
    await fs.symlink(target, link, 'dir');
    made.push(link);

    await sweepStaleUploadDirs();

    expect(await exists(link)).toBe(true);
    expect(await exists(path.join(target, 'keep.txt'))).toBe(true);
  });
});
