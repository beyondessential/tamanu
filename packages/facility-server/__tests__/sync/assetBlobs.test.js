import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';

import { BLOB_TIERS } from '@tamanu/constants';
import { BlobStore } from '@tamanu/database/blobStore';
import { NotFoundError } from '@tamanu/errors';

import { createTestContext } from '../utilities';
import { FacilityBlobCache } from '../../app/blobCache/FacilityBlobCache';
import { prefetchAssets } from '../../app/sync/prefetchAssets';

const hashOf = content => `sha256:${createHash('sha256').update(content).digest('hex')}`;

async function readAll(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

describe('asset blobs on a facility', () => {
  let ctx;
  let models;
  let root;
  let blobStore;
  let blobCache;
  let cacheBudgetBytes;
  let freeDiskReserveBytes;
  let central;
  let fetchAttempts;
  let transferChannel;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
  });

  afterAll(() => ctx.close());

  beforeEach(async () => {
    await models.Asset.destroy({ where: {}, force: true });
    await models.Blob.destroy({ where: {}, force: true });
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'asset-blobs-test-'));
    cacheBudgetBytes = 10 * 1024 ** 3;
    freeDiskReserveBytes = 0;
    blobStore = new BlobStore({
      root,
      models,
      getFreeDiskReserveBytes: async () => freeDiskReserveBytes,
      evictCache: async bytesNeeded => {
        await blobCache.evictBytes(bytesNeeded);
      },
    });
    blobCache = new FacilityBlobCache({
      blobStore,
      models,
      getCacheBudgetBytes: async () => cacheBudgetBytes,
    });
    central = new Map();
    fetchAttempts = [];
    transferChannel = {
      fetchFromCentral: async hash => {
        fetchAttempts.push(hash);
        const content = central.get(hash);
        if (!content) throw new NotFoundError(`central does not hold ${hash}`);
        await blobStore.stage(hash, Readable.from(content), { offset: 0 });
        return await blobStore.commitStaged(hash);
      },
    };
    blobCache.setTransferChannel(transferChannel);
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  const seedAsset = async (content = Buffer.from(`asset image ${randomUUID()}`)) => {
    const hash = hashOf(content);
    central.set(hash, content);
    await models.Asset.create({
      name: `letterhead-${randomUUID()}`,
      type: 'image/png',
      hash,
      data: null,
    });
    return { hash, content };
  };

  const prefetch = () => prefetchAssets({ models, transferChannel, blobCache });

  // verifies spec: ASSET, CACHE
  describe('cache-tier content', () => {
    it('admits prefetched asset content at the cache tier', async () => {
      const { hash } = await seedAsset();

      await prefetch();

      expect((await models.Blob.findOne({ where: { hash } })).tier).toBe(BLOB_TIERS.CACHE);
    });

    it('evicts an asset blob under the budget like any other cache content', async () => {
      const { hash } = await seedAsset();
      await prefetch();
      cacheBudgetBytes = 1;
      // Eviction protects the most recently used blob, so give it company.
      await blobStore.put(Readable.from(Buffer.from(`unrelated ${randomUUID()}`)));

      await blobCache.enforceBudget();

      expect(await blobStore.has(hash)).toBe(false);
      expect(await models.Asset.count({ where: { hash } })).toBe(1);
    });

    it('refetches an evicted asset blob on demand', async () => {
      const { hash, content } = await seedAsset();
      await prefetch();
      await blobCache.evictBytes(content.length);
      expect(await blobStore.has(hash)).toBe(false);

      const served = await readAll(await blobCache.open(hash));

      expect(served.equals(content)).toBe(true);
      expect(fetchAttempts).toEqual([hash, hash]);
    });
  });

  // verifies spec: CAP, XFER
  // A background fetch the store refuses for capacity is an ordinary failed
  // fetch: nothing is admitted, the asset row stands with its bytes unresolved,
  // and the next pass tries again rather than the reference being written off.
  describe('a fetch refused for capacity', () => {
    it('leaves the asset awaiting its content and fetches it again next pass', async () => {
      const { hash, content } = await seedAsset();
      freeDiskReserveBytes = Number.MAX_SAFE_INTEGER;

      await prefetch();

      expect(await blobStore.has(hash)).toBe(false);
      expect(await models.Blob.findOne({ where: { hash } })).toBeNull();
      expect(await models.Asset.count({ where: { hash } })).toBe(1);

      freeDiskReserveBytes = 0;
      await prefetch();

      expect(fetchAttempts).toEqual([hash, hash]);
      expect((await readAll(await blobStore.get(hash))).equals(content)).toBe(true);
    });
  });
});
