import { BLOB_TIERS } from '@tamanu/constants';

import { Database } from '~/infra/db';
import { FakeBlobFileSystem, sha256Hash } from '/root/tests/helpers/fakeBlobFileSystem';
import { MobileBlobStore } from './MobileBlobStore';
import { MobileBlobCache } from './MobileBlobCache';
import { deriveFreeDiskReserveBytes } from './deviceStorage';

const ROOT = '/blobs';

describe('MobileBlobCache', () => {
  let fs: FakeBlobFileSystem;
  let store: MobileBlobStore;
  let cache: MobileBlobCache;

  beforeAll(async () => {
    await Database.connect();
  });

  beforeEach(async () => {
    await Database.models.Blob.getRepository().clear();
    fs = new FakeBlobFileSystem();
    store = new MobileBlobStore({
      root: ROOT,
      models: Database.models,
      getFreeDiskReserveBytes: deriveFreeDiskReserveBytes,
      evictCache: bytesNeeded => cache.evictBytes(bytesNeeded),
      fs,
    });
    cache = new MobileBlobCache({ blobStore: store, models: Database.models, fs });
  });

  describe('putOutbox', () => {
    // verifies spec: MOB, CACHE — capture admits to the outbox tier
    it('admits captured content to the outbox tier', async () => {
      fs.seed('/tmp/photo.jpg', 'captured');
      const { hash } = await cache.putOutbox('/tmp/photo.jpg');
      const row = await Database.models.Blob.findOne({ where: { hash } });
      expect(row.tier).toBe(BLOB_TIERS.OUTBOX);
    });
  });

  describe('open', () => {
    // verifies spec: MOB — content the device holds reads without connectivity
    it('reads held content without touching the transfer channel', async () => {
      const channel = { fetchFromCentral: jest.fn() };
      cache.setTransferChannel(channel as any);
      fs.seed('/tmp/local.jpg', 'local bytes');
      const { hash } = await cache.putOutbox('/tmp/local.jpg');

      const path = await cache.open(hash);
      expect(path).toBe(store.pathFor(hash));
      expect(channel.fetchFromCentral).not.toHaveBeenCalled();
    });

    // verifies spec: MOB, XFER — a miss fetches by hash and admits to cache
    it('fetches a missing blob and admits it so a later read is local', async () => {
      const hash = sha256Hash('fetched');
      const channel = {
        fetchFromCentral: jest.fn(async () => {
          fs.seed(store.pathFor(hash), 'fetched');
          await insertVerified(hash, 'fetched');
        }),
      };
      cache.setTransferChannel(channel as any);

      const path = await cache.open(hash);
      expect(path).toBe(store.pathFor(hash));
      expect(channel.fetchFromCentral).toHaveBeenCalledTimes(1);

      await cache.open(hash);
      // second read is local; no further fetch
      expect(channel.fetchFromCentral).toHaveBeenCalledTimes(1);
    });

    // verifies spec: SCRUB — corrupt cache content refetches rather than displaying
    it('drops and refetches corrupt cache content', async () => {
      const hash = sha256Hash('good content');
      await insertVerified(hash, 'good content', BLOB_TIERS.CACHE);
      fs.seed(store.pathFor(hash), 'corrupted');

      let fetched = false;
      const channel = {
        fetchFromCentral: jest.fn(async () => {
          fs.seed(store.pathFor(hash), 'good content');
          await insertVerified(hash, 'good content', BLOB_TIERS.CACHE);
          fetched = true;
        }),
      };
      cache.setTransferChannel(channel as any);

      const path = await cache.open(hash);
      expect(fetched).toBe(true);
      expect(path).toBe(store.pathFor(hash));
    });

    // verifies spec: SCRUB, MOB — corrupt outbox content is quarantined and surfaced
    it('quarantines corrupt outbox content instead of refetching', async () => {
      const hash = sha256Hash('captured content');
      await insertVerified(hash, 'captured content', BLOB_TIERS.OUTBOX);
      fs.seed(store.pathFor(hash), 'corrupted');
      cache.setTransferChannel({ fetchFromCentral: jest.fn() } as any);

      await expect(cache.open(hash)).rejects.toThrow(/corrupt/i);
      const row = await Database.models.Blob.findOne({ where: { hash } });
      expect(row.integrityState).toBe('quarantined');
    });
  });

  describe('demote', () => {
    // verifies spec: CACHE — an acknowledged blob moves from outbox to cache
    it('moves an outbox blob to the cache tier', async () => {
      fs.seed('/tmp/e.jpg', 'push me');
      const { hash } = await cache.putOutbox('/tmp/e.jpg');
      await cache.demote(hash);
      const row = await Database.models.Blob.findOne({ where: { hash } });
      expect(row.tier).toBe(BLOB_TIERS.CACHE);
    });
  });

  describe('enforceBudget', () => {
    // verifies spec: CACHE — LRU eviction, outbox untouched, MRU protected
    it('evicts least-recently-used cache blobs and leaves the outbox alone', async () => {
      // budget derives to something small by squeezing free space
      fs.totalSpace = 16 * 1024 ** 3;
      fs.freeSpace = 1 * 1024 ** 3;

      const oldCache = await seedCacheBlob('old-cache', 400 * 1024 ** 2, '2000-01-01 00:00:00');
      const newCache = await seedCacheBlob('new-cache', 400 * 1024 ** 2, '2030-01-01 00:00:00');
      const outbox = await seedOutboxBlob('outbox', 400 * 1024 ** 2);

      await cache.enforceBudget();

      // least-recently-used cache blob goes first; the most-recent is protected
      expect(await store.has(oldCache)).toBe(false);
      expect(await store.has(newCache)).toBe(true);
      // outbox never counts against the budget nor is evicted
      expect(await store.has(outbox)).toBe(true);
    });
  });

  // Insert a verified registry row for content the fake fs already holds.
  async function insertVerified(hash: string, contents: string, tier = BLOB_TIERS.CACHE) {
    await Database.models.Blob.getRepository().query(
      `INSERT INTO blobs (id, hash, size, integrityState, tier, lastAccessedAt)
       VALUES (?, ?, ?, 'verified', ?, datetime('now'))
       ON CONFLICT (hash) DO UPDATE SET deletedAt = NULL, tier = excluded.tier`,
      [`blob-${hash}`, hash, Buffer.from(contents).length, tier],
    );
  }

  async function seedCacheBlob(label: string, size: number, lastAccessedAt: string) {
    const hash = sha256Hash(label);
    fs.seed(store.pathFor(hash), label);
    await Database.models.Blob.getRepository().query(
      `INSERT INTO blobs (id, hash, size, integrityState, tier, lastAccessedAt)
       VALUES (?, ?, ?, 'verified', ?, ?)`,
      [`blob-${label}`, hash, size, BLOB_TIERS.CACHE, lastAccessedAt],
    );
    return hash;
  }

  async function seedOutboxBlob(label: string, size: number) {
    const hash = sha256Hash(label);
    fs.seed(store.pathFor(hash), label);
    await Database.models.Blob.getRepository().query(
      `INSERT INTO blobs (id, hash, size, integrityState, tier, lastAccessedAt)
       VALUES (?, ?, ?, 'verified', ?, datetime('now'))`,
      [`blob-${label}`, hash, size, BLOB_TIERS.OUTBOX],
    );
    return hash;
  }
});
