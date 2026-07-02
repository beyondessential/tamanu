import checkDiskSpace from 'check-disk-space';
import { log } from '@tamanu/shared/services/logging';

// Returns the available disk space in bytes for the path in the DISK_PATH env var.
export const getFreeDiskSpace = async () => {
  try {
    const diskStats = await checkDiskSpace(process.env.DISK_PATH ?? '/tmp');
    return diskStats.free;
  } catch (error) {
    log.error(`Unable to determine free disk space, got error: \n${error.message}`);
    return null;
  }
};

// Tries to read free disk space and compares it to minimum required from config.
export const canUploadAttachment = async settings => {
  const gigabytesForUploadingDocuments = await settings.get(
    'disk.freeSpaceRequired.gigabytesForUploadingDocuments',
  );
  // Convert value in settings to bytes (prefer decimal over binary conversion)
  const freeSpaceRequired = Number.parseInt(gigabytesForUploadingDocuments, 10) * 1_000_000_000;
  const freeDiskSpace = await getFreeDiskSpace();

  if (!freeDiskSpace || freeDiskSpace < freeSpaceRequired) {
    return false;
  }

  return true;
};
