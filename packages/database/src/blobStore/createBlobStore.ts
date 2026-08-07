import path from 'node:path';

import { BlobStore } from './BlobStore';
import type { Blob } from '../models/Blob';

const BYTES_PER_GB = 1024 ** 3;

interface SettingsReader {
  get: (path: string) => Promise<any>;
}

/**
 * Build this server's blob store from settings: the store root is server-scoped
 * so it can sit on a dedicated volume, and the free-disk reserve is global.
 * The reserve is read per check rather than captured, so raising it takes
 * effect without a restart.
 */
export async function createBlobStore({
  models,
  settings,
  evictCache,
}: {
  models: { Blob: typeof Blob };
  settings: SettingsReader;
  evictCache?: (bytesNeeded: number) => Promise<void>;
}): Promise<BlobStore> {
  const root = await settings.get('blobStorage.root');
  return new BlobStore({
    root: path.resolve(root),
    models,
    getFreeDiskReserveBytes: async () =>
      (await settings.get('blobStorage.freeDiskReserveGB')) * BYTES_PER_GB,
    evictCache,
  });
}
