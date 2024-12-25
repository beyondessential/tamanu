import os from 'os';
import path from 'path';
import { mkdirp } from 'mkdirp';

export const tmpdir = async () => {
  const dir = path.resolve(os.tmpdir());
  await mkdirp(dir); // on windows, os.tmpdir() can return a non-existent folder
  return dir;
};
