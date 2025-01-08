import os from 'node:os';
import path from 'node:path';
import mkdirp from 'mkdirp';

export async function tmpdir() {
  const dir = path.resolve(os.tmpdir());
  await mkdirp(dir); // on windows, os.tmpdir() can return a non-existent folder
  return dir;
}
