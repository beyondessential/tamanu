import { mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export async function tmpdir() {
  const dir = path.resolve(os.tmpdir());
  await mkdir(dir, { recursive: true }); // on windows, os.tmpdir() can return a non-existent folder
  return dir;
}
