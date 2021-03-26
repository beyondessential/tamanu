import os from 'os';
import fs from 'fs';

export async function createFilePathForEmailAttachment(fileName) {
  const filePath = os.tmpdir() + '/' + fileName;
  return filePath;
}

export function removeFile(filePath) {
  return new Promise(function(resolve, reject) {
    fs.unlink(filePath, function(err) {
      if (err) {
        resolve([undefined, err]);
      } else {
        resolve([]);
      }
    });
  });
}
