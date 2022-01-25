import config from 'config';
import checkDiskSpace from 'check-disk-space';
import { log } from 'shared/services/logging';

// Wraps a module function and calls it with parameters from config.
// Returns the available disk space in bytes.
export const getFreeDiskSpace = async () => {
  try {
    const diskStats = await checkDiskSpace(config.disk.diskPath);
    return diskStats.free;
  } catch (error) {
    log.error(`Unable to determine free disk space, got error: \n${error.message}`);
    return null;
  }
};
