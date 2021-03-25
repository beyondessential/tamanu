import os from 'os';
import fs from 'fs';

export async function createFilePathForEmailAttachment(fileName) {
  const filePath = os.tmpdir() + '/' + fileName;
  await fs.unlink(filePath);
  return filePath;
}
