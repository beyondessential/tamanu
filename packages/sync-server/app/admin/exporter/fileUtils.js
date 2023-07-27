import { promises as fs } from 'fs';
import config from 'config';

const ONE_MEGABYTE_IN_BYTES = 1024 * 1024;

export async function getExportedFileSize(filename) {
  const { maxFileSizeInMB } = config.export;
  const maxChunkSizeInBytes = maxFileSizeInMB * ONE_MEGABYTE_IN_BYTES;
  const { size } = await fs.stat(filename);
  return { sizeInBytes: size, maxChunkSizeInBytes };
}

export function getExportedFileName(userId) {
  return `exported-${userId}.xlsx`;
}
