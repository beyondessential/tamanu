import mkdirp from 'mkdirp';
import os from 'os';
import path from 'path';

export async function tmpdir() {
  const dir = path.resolve(os.tmpdir());
  await mkdirp(dir); // on windows, os.tmpdir() can return a non-existent folder
  return dir;
}
