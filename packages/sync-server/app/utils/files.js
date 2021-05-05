import os from 'os';
import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';

export async function createFilePathForEmailAttachment(fileName) {
  const filePath = path.join(await tmpdir(), fileName);
  return filePath;
}

// on windows, os.tmpdir() can return a non-existent folder
export async function tmpdir() {
  const dir = path.resolve(os.tmpdir());
  await mkdirp(dir);
  return dir;
}

export function removeFile(filePath) {
  return new Promise(resolve => {
    fs.unlink(filePath, err => {
      if (err) {
        resolve([undefined, err]);
      } else {
        resolve([]);
      }
    });
  });
}
