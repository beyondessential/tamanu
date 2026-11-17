import { mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export function tmpdirPath() {
  return path.resolve(os.tmpdir());
}

export async function tmpdir() {
  const dir = tmpdirPath();
  await mkdir(dir, { recursive: true }); // on windows, os.tmpdir() can return a non-existent folder
  return dir;
}
