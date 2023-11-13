import checkDiskSpace from 'check-disk-space';
import { log } from '@tamanu/shared/services/logging';

// Wraps a module function and calls it with parameters from config.
// Returns the available disk space in bytes.
export const getFreeDiskSpace = async diskPath => {
  try {
    const diskStats = await checkDiskSpace(diskPath);
    return diskStats.free;
  } catch (error) {
    log.error(`Unable to determine free disk space, got error: \n${error.message}`);
    return null;
  }
};

// Tries to read free disk space and compares it to minimum required from config.
export const canUploadAttachment = async diskSettings => {
  const { diskPath, freeSpaceRequired } = diskSettings;
  const { gigabytesForUploadingDocuments } = freeSpaceRequired;
  // Convert value in settings to bytes (prefer decimal over binary conversion)
  const freeSpace = parseInt(gigabytesForUploadingDocuments, 10) * 1000000000;
  const freeDiskSpace = await getFreeDiskSpace(diskPath);

  if (!freeDiskSpace || freeDiskSpace < freeSpace) {
    return false;
  }

  return true;
};
