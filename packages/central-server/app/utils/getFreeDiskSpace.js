import checkDiskSpace from 'check-disk-space';
import config from 'config';
import { log } from '@tamanu/shared/services/logging';

// Returns the available disk space in bytes for the path in the DISK_PATH env var.
// The config key is transitional and the platform default matches the old config
// default, so manually-managed Windows servers keep working without the env var.
export const getFreeDiskSpace = async () => {
  const diskPath =
    process.env.DISK_PATH ??
    config.disk?.diskPath ??
    (process.platform === 'win32' ? 'C:/' : '/tmp');
  try {
    const diskStats = await checkDiskSpace(diskPath);
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
