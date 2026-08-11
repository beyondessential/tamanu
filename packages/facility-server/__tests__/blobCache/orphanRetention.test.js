import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';

import { BlobStore } from '@tamanu/database/blobStore';

import { createTestContext } from '../utilities';
import { FacilityBlobCache } from '../../app/blobCache/FacilityBlobCache';

const GB = 1024 ** 3;

// spec: RECL
// Orphan collection is central's alone. A facility reclaims space by evicting
// cached blobs under a size budget, so content nothing references stays put for
// as long as the budget allows.
describe('facility reclamation', () => {
  let ctx;
  let root;
  let blobStore;
  let blobCache;

  beforeAll(async () => {
    ctx = await createTestContext();
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'facility-orphan-test-'));
    blobStore = new BlobStore({
      root,
      models: ctx.models,
      getFreeDiskReserveBytes: async () => 0,
    });
    blobCache = new FacilityBlobCache({
      blobStore,
      models: ctx.models,
      getCacheBudgetBytes: async () => 10 * GB,
    });
  });

  afterAll(async () => {
    await fs.rm(root, { recursive: true, force: true });
    await ctx.close();
  });

  it('retains a blob no record references', async () => {
    const content = Buffer.from(`unreferenced facility content ${randomUUID()}`);
    const { hash } = await blobStore.put(Readable.from([content]));

    expect(await blobCache.enforceBudget()).toEqual({ evictedBytes: 0, evictedCount: 0 });
    expect(await blobStore.has(hash)).toBe(true);
  });
});
