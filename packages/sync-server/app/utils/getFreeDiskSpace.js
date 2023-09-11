import config from 'config';
import checkDiskSpace from 'check-disk-space';
import { log } from 'shared/services/logging';

// Convert value in config to bytes (prefer decimal over binary conversion)
const FREE_SPACE_REQUIRED =
  parseInt(config.disk.freeSpaceRequired.gigabytesForUploadingDocuments, 10) * 1000000000;

// Wraps a module function and calls it with parameters from config.
// Returns the available disk space in bytes.
export const getFreeDiskSpace = async () => {
  try {
    // TODO: Use db config fetcher
    const diskStats = await checkDiskSpace(config.disk.diskPath);
    return diskStats.free;
  } catch (error) {
    log.error(`Unable to determine free disk space, got error: \n${error.message}`);
    return null;
  }
};

// Tries to read free disk space and compares it to minimum required from config.
export const canUploadAttachment = async () => {
  const freeDiskSpace = await getFreeDiskSpace();

  if (!freeDiskSpace || freeDiskSpace < FREE_SPACE_REQUIRED) {
    return false;
  }

  return true;
};
