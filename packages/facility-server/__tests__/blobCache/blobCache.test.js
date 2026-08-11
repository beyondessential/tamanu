import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';

import { FACILITY_PARITY_TIERS, PARITY_SIDECAR_SUFFIX } from '@tamanu/blobs';
import { BLOB_INTEGRITY_STATES, BLOB_TIERS } from '@tamanu/constants';
import { FACT_LAST_SUCCESSFUL_SYNC_PUSH } from '@tamanu/constants/facts';
import { BlobStore } from '@tamanu/database/blobStore';

import { createTestContext } from '../utilities';
import { FacilityBlobCache } from '../../app/blobCache/FacilityBlobCache';
import { BlobOutboxPusher } from '../../app/blobCache/BlobOutboxPusher';
import { blobOutboxStatus } from '../../app/blobCache/outboxStatus';
import { makeSyncedReferenceResolver } from '../../app/blobCache/referenceResolvers';

const GB = 1024 ** 3;

const hashOf = content => `sha256:${createHash('sha256').update(content).digest('hex')}`;

const uniqueContent = () => Buffer.from(`blob content ${randomUUID()}`);

async function readAll(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function waitFor(predicate, { timeoutMs = 5000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error('waitFor timed out');
    await new Promise(resolve => {
      setTimeout(resolve, 10);
    });
  }
}

describe('facility blob outbox and LRU cache', () => {
  let ctx;
  let models;
  let root;
  let blobStore;
  let blobCache;
  let cacheBudgetBytes;
  let errorCorrection;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
  });

  afterAll(() => ctx.close());

  beforeEach(async () => {
    await models.Blob.destroy({ where: {}, force: true });
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'blob-cache-test-'));
    cacheBudgetBytes = 10 * GB;
    // Off by default, as on a server that has not enabled it; the parity case
    // below switches it on before admitting anything.
    errorCorrection = { enabled: false, proportion: 0.1 };
    blobStore = new BlobStore({
      root,
      models,
      getFreeDiskReserveBytes: async () => 0,
      errorCorrection: {
        coveredTiers: FACILITY_PARITY_TIERS,
        getSettings: async () => errorCorrection,
      },
    });
    blobCache = new FacilityBlobCache({
      blobStore,
      models,
      getCacheBudgetBytes: async () => cacheBudgetBytes,
    });
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  const putCache = async (content = uniqueContent()) => {
    const { hash } = await blobStore.put(Readable.from(content));
    return { hash, content };
  };

  const putOutbox = async (content = uniqueContent()) => {
    const { hash } = await blobCache.putOutbox(Readable.from(content));
    return { hash, content };
  };

  const tierOf = async hash => (await models.Blob.findOne({ where: { hash } })).tier;

  const setLastAccessed = async (hash, msAgo) =>
    models.Blob.update(
      { lastAccessedAt: new Date(Date.now() - msAgo) },
      { where: { hash }, silent: true },
    );

  describe('outbox and cache tiers', () => {
    it('admits locally originated content as outbox', async () => {
      // verifies spec: CACHE
      const { hash } = await putOutbox();
      expect(await tierOf(hash)).toBe(BLOB_TIERS.OUTBOX);
    });

    it('keeps content already held as cache in the cache tier on outbox re-admission', async () => {
      // verifies spec: CACHE — the tier reflects whether central holds the bytes
      const content = uniqueContent();
      await putCache(content);
      const { hash } = await putOutbox(content);
      expect(await tierOf(hash)).toBe(BLOB_TIERS.CACHE);
    });

    it('keeps an un-acknowledged blob in the outbox on repeat admission', async () => {
      const content = uniqueContent();
      const { hash } = await putOutbox(content);
      const again = await blobCache.putOutbox(Readable.from(content));
      expect(again.existed).toBe(true);
      expect(await tierOf(hash)).toBe(BLOB_TIERS.OUTBOX);
    });

    it('demotes an acknowledged blob to cache and clears its eligibility marker', async () => {
      // verifies spec: CACHE
      const { hash } = await putOutbox();
      await models.Blob.update({ eligibleSinceTick: 7 }, { where: { hash } });

      await blobCache.demote(hash);

      const row = await models.Blob.findOne({ where: { hash } });
      expect(row.tier).toBe(BLOB_TIERS.CACHE);
      expect(row.eligibleSinceTick).toBeNull();
    });

    it('discards the parity of a demoted blob, since the cache tier carries none', async () => {
      // verifies spec: FEC — central holds the content once it acknowledges the
      // push, so a corrupt cache copy costs a refetch rather than needing parity
      errorCorrection = { enabled: true, proportion: 0.1 };
      const { hash } = await putOutbox(Buffer.alloc(64 * 1024, 'o'));
      const digest = hash.split(':')[1];
      const sidecar = path.join(
        root,
        'sha256',
        digest.slice(0, 2),
        digest.slice(2, 4),
        `${digest.slice(4)}${PARITY_SIDECAR_SUFFIX}`,
      );
      await expect(fs.access(sidecar)).resolves.toBeUndefined();

      await blobCache.demote(hash);

      await expect(fs.access(sidecar)).rejects.toThrow();
      const row = await models.Blob.findOne({ where: { hash } });
      expect(row.tier).toBe(BLOB_TIERS.CACHE);
      expect(row.hasParity).toBe(false);
    });
  });

  describe('read-through open', () => {
    it('serves local bytes and refreshes stale recency', async () => {
      // verifies spec: CACHE — any read refreshes recency
      const { hash, content } = await putCache();
      await setLastAccessed(hash, 10 * 60 * 1000);

      const served = await readAll(await blobCache.open(hash));
      expect(served.equals(content)).toBe(true);

      const row = await models.Blob.findOne({ where: { hash } });
      expect(Date.now() - row.lastAccessedAt.getTime()).toBeLessThan(60 * 1000);
    });

    it('coalesces recency updates within the window', async () => {
      // verifies spec: CACHE — recency updates may be coalesced
      const { hash } = await putCache();
      await setLastAccessed(hash, 30 * 1000);
      const before = (await models.Blob.findOne({ where: { hash } })).lastAccessedAt;

      await readAll(await blobCache.open(hash));

      const after = (await models.Blob.findOne({ where: { hash } })).lastAccessedAt;
      expect(after.getTime()).toBe(before.getTime());
    });

    it('fetches from central on a local miss, then serves', async () => {
      // verifies spec: CACHE, XFER — evicted or absent content refetches on demand
      const content = uniqueContent();
      const hash = hashOf(content);
      blobCache.setTransferChannel({
        fetchFromCentral: async wanted => {
          expect(wanted).toBe(hash);
          return await blobStore.put(Readable.from(content));
        },
      });

      const served = await readAll(await blobCache.open(hash));
      expect(served.equals(content)).toBe(true);
      expect(await tierOf(hash)).toBe(BLOB_TIERS.CACHE);
    });

    it('reports not-found on a local miss with no central connection', async () => {
      await expect(blobCache.open(hashOf('never anywhere'))).rejects.toThrow(/no central/);
    });

    // spec: SCRUB, CACHE — a copy the store will not serve is a miss, so the
    // read resolves it from central instead of failing against the local copy.
    it('refetches a corrupt local copy rather than failing the read', async () => {
      const content = uniqueContent();
      const { hash } = await blobStore.put(Readable.from(content));
      await blobStore.recordIntegrityState(hash, BLOB_INTEGRITY_STATES.CORRUPT);
      let fetched = 0;
      blobCache.setTransferChannel({
        fetchFromCentral: async wanted => {
          fetched += 1;
          await blobStore.stage(wanted, Readable.from(content), { offset: 0 });
          return await blobStore.commitStaged(wanted);
        },
      });

      const served = await readAll(await blobCache.open(hash));
      expect(served.equals(content)).toBe(true);
      expect(fetched).toBe(1);
    });
  });

  describe('eviction', () => {
    it('evicts least-recently-used cache blobs first once over budget', async () => {
      // verifies spec: CACHE
      const oldest = await putCache();
      const middle = await putCache();
      const newest = await putCache();
      await setLastAccessed(oldest.hash, 3 * 60 * 60 * 1000);
      await setLastAccessed(middle.hash, 2 * 60 * 60 * 1000);
      await setLastAccessed(newest.hash, 60 * 60 * 1000);
      // budget forces roughly one blob's worth of eviction
      cacheBudgetBytes = middle.content.length + newest.content.length;

      await blobCache.enforceBudget();

      expect(await blobStore.has(oldest.hash)).toBe(false);
      expect(await blobStore.has(middle.hash)).toBe(true);
      expect(await blobStore.has(newest.hash)).toBe(true);
    });

    it('never evicts the most recently used blob merely to satisfy the budget', async () => {
      // verifies spec: CACHE — a blob larger than the budget serves reads while in use
      const only = await putCache();
      cacheBudgetBytes = 1; // the lone cache blob exceeds the whole budget

      const result = await blobCache.enforceBudget();

      expect(result.evictedCount).toBe(0);
      expect(await blobStore.has(only.hash)).toBe(true);
    });

    it('leaves outbox blobs untouched and outside the budget', async () => {
      // verifies spec: CACHE — outbox blobs are never evicted and count against neither
      const outbox = await putOutbox();
      const cacheA = await putCache();
      const cacheB = await putCache();
      await setLastAccessed(outbox.hash, 10 * 60 * 60 * 1000);
      await setLastAccessed(cacheA.hash, 2 * 60 * 60 * 1000);
      cacheBudgetBytes = cacheB.content.length;

      await blobCache.enforceBudget();

      expect(await blobStore.has(outbox.hash)).toBe(true);
      expect(await blobStore.has(cacheA.hash)).toBe(false);
    });

    it('defers eviction of a blob with a read in progress until the read completes', async () => {
      // verifies spec: CACHE
      const oldest = await putCache();
      const newest = await putCache();
      cacheBudgetBytes = newest.content.length;

      const inProgress = await blobCache.open(oldest.hash);
      // the open refreshed recency; re-pin it as the LRU so only the active
      // read protects it
      await setLastAccessed(oldest.hash, 2 * 60 * 60 * 1000);

      await blobCache.enforceBudget();
      expect(await blobStore.has(oldest.hash)).toBe(true);

      await readAll(inProgress); // completes and closes the stream
      // the close event lands a tick later; wait for the guard to release
      await waitFor(() => inProgress.closed);
      await blobCache.enforceBudget();
      expect(await blobStore.has(oldest.hash)).toBe(false);
    });

    it('evicts even the most recently used blob under free-disk floor pressure', async () => {
      // verifies spec: CAP — the floor is the hard bound, the budget is a target
      const only = await putCache();

      const result = await blobCache.evictBytes(1);

      expect(result.evictedCount).toBe(1);
      expect(await blobStore.has(only.hash)).toBe(false);
    });

    it('applies a budget change on the next enforcement pass', async () => {
      // verifies spec: CACHE — budget is read per pass, no restart needed
      const blob = await putCache();
      await setLastAccessed(blob.hash, 2 * 60 * 60 * 1000);
      await putCache(); // newer MRU blob so the first is a candidate
      await blobCache.enforceBudget();
      expect(await blobStore.has(blob.hash)).toBe(true);

      cacheBudgetBytes = 1;
      await blobCache.enforceBudget();
      expect(await blobStore.has(blob.hash)).toBe(false);
    });

    it('evicts nothing when the budget is not a finite number', async () => {
      // A misread or unset budget must not be taken as "evict everything".
      const blob = await putCache();
      cacheBudgetBytes = undefined;

      const result = await blobCache.enforceBudget();

      expect(result.evictedCount).toBe(0);
      expect(await blobStore.has(blob.hash)).toBe(true);
    });
  });

  describe('background pusher', () => {
    const makePusher = ({ resolvers, pushToCentral }) =>
      new BlobOutboxPusher({
        models,
        transferChannel: { pushToCentral },
        blobCache,
        referenceResolvers: resolvers,
      });

    const eligibleAll = async (_models, hashes) => hashes;

    it('pushes only blobs whose referencing record has synchronised', async () => {
      // verifies spec: CACHE — eligibility gate
      const synced = await putOutbox();
      const unsynced = await putOutbox();
      const pushed = [];
      const pusher = makePusher({
        resolvers: [async (_models, hashes) => hashes.filter(h => h === synced.hash)],
        pushToCentral: async hash => {
          pushed.push(hash);
          return { acknowledged: true };
        },
      });

      await pusher.runOnce();

      expect(pushed).toEqual([synced.hash]);
      expect(await tierOf(synced.hash)).toBe(BLOB_TIERS.CACHE);
      expect(await tierOf(unsynced.hash)).toBe(BLOB_TIERS.OUTBOX);
    });

    it('offers eligible blobs oldest-first', async () => {
      // verifies spec: CACHE
      const first = await putOutbox();
      const second = await putOutbox();
      await models.Blob.update(
        { createdAt: new Date(Date.now() - 60 * 60 * 1000) },
        { where: { hash: first.hash }, silent: true },
      );
      const pushed = [];
      const pusher = makePusher({
        resolvers: [eligibleAll],
        pushToCentral: async hash => {
          pushed.push(hash);
          return { acknowledged: true };
        },
      });

      await pusher.runOnce();

      expect(pushed).toEqual([first.hash, second.hash]);
    });

    it('continues past a failed push and leaves the blob in the outbox', async () => {
      // verifies spec: CACHE — a refused or failed offer does not block the queue
      const failing = await putOutbox();
      const fine = await putOutbox();
      await models.Blob.update(
        { createdAt: new Date(Date.now() - 60 * 60 * 1000) },
        { where: { hash: failing.hash }, silent: true },
      );
      const pusher = makePusher({
        resolvers: [eligibleAll],
        pushToCentral: async hash => {
          if (hash === failing.hash) throw new Error('central refused the offer');
          return { acknowledged: true };
        },
      });

      const counts = await pusher.runOnce();

      expect(counts).toMatchObject({ pushed: 1, failed: 1 });
      expect(await tierOf(failing.hash)).toBe(BLOB_TIERS.OUTBOX);
      expect(await tierOf(fine.hash)).toBe(BLOB_TIERS.CACHE);
    });

    it('starts no second transfer for a blob whose push is in flight', async () => {
      // verifies spec: CACHE — at most one transfer in flight per blob
      const { hash } = await putOutbox();
      let resolvePush;
      let attempts = 0;
      const pusher = makePusher({
        resolvers: [eligibleAll],
        pushToCentral: () => {
          attempts += 1;
          return new Promise(resolve => {
            resolvePush = () => resolve({ acknowledged: true });
          });
        },
      });

      const firstRun = pusher.runOnce();
      await waitFor(() => attempts === 1); // the first push is in flight
      const secondRun = pusher.runOnce();

      resolvePush();
      await Promise.all([firstRun, secondRun]);

      expect(attempts).toBe(1);
      expect(await tierOf(hash)).toBe(BLOB_TIERS.CACHE);
    });

    it('leaves a blob in the outbox when a push returns without acknowledgement', async () => {
      // verifies spec: CACHE — only an acknowledged push demotes the blob
      const { hash } = await putOutbox();
      const pusher = makePusher({
        resolvers: [eligibleAll],
        pushToCentral: async () => ({ acknowledged: false }),
      });

      const counts = await pusher.runOnce();

      expect(counts).toMatchObject({ pushed: 0, skipped: 1 });
      expect(await tierOf(hash)).toBe(BLOB_TIERS.OUTBOX);
    });

    it('counts a push as done even if the local demotion fails', async () => {
      // spec: XFER — an acknowledgement means the bytes are durable on central,
      // so a failed local demote does not undo the push; it re-demotes next pass
      const { hash } = await putOutbox();
      const pusher = new BlobOutboxPusher({
        models,
        transferChannel: { pushToCentral: async () => ({ acknowledged: true }) },
        blobCache: {
          demote: async () => {
            throw new Error('registry unavailable');
          },
        },
        referenceResolvers: [eligibleAll],
      });

      const counts = await pusher.runOnce();

      expect(counts).toMatchObject({ pushed: 1, failed: 0 });
      // demote threw, so the blob is still outbox — a later pass re-offers and
      // re-demotes it (central's store is idempotent).
      expect(await tierOf(hash)).toBe(BLOB_TIERS.OUTBOX);
    });
  });

  describe('outbox dysfunction measure', () => {
    let originalPushCursor;

    beforeEach(async () => {
      originalPushCursor = await models.LocalSystemFact.get(FACT_LAST_SUCCESSFUL_SYNC_PUSH);
    });

    afterEach(async () => {
      if (originalPushCursor == null) {
        await models.LocalSystemFact.destroy({
          where: { key: FACT_LAST_SUCCESSFUL_SYNC_PUSH },
          force: true,
        });
      } else {
        await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PUSH, originalPushCursor);
      }
    });

    const eligibleSinceOf = async hash =>
      (await models.Blob.findOne({ where: { hash } })).eligibleSinceTick;

    const makeCyclePusher = eligibleHash =>
      new BlobOutboxPusher({
        models,
        transferChannel: { pushToCentral: async () => ({ acknowledged: true }) },
        blobCache,
        referenceResolvers: [async (_models, hashes) => hashes.filter(h => h === eligibleHash)],
      });

    it('marks an eligible outbox blob once, at the push cursor when first eligible', async () => {
      // verifies spec: CAP — the measure counts from eligibility, set once
      const eligible = await putOutbox();
      const unsynced = await putOutbox();
      const pusher = makeCyclePusher(eligible.hash);

      await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PUSH, '100');
      await pusher.recordSyncCycle();
      expect(await eligibleSinceOf(eligible.hash)).toBe(100);
      expect(await eligibleSinceOf(unsynced.hash)).toBeNull();

      // a later cycle leaves the existing marker untouched
      await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PUSH, '200');
      await pusher.recordSyncCycle();
      expect(await eligibleSinceOf(eligible.hash)).toBe(100);
      expect(await eligibleSinceOf(unsynced.hash)).toBeNull();
    });

    it('clears the marker when a pushed blob is demoted', async () => {
      // verifies spec: CACHE — demotion resets the eligibility marker
      const { hash } = await putOutbox();
      const pusher = makeCyclePusher(hash);
      await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PUSH, '5');
      await pusher.recordSyncCycle();
      expect(await eligibleSinceOf(hash)).toBe(5);

      await blobCache.demote(hash);
      expect(await eligibleSinceOf(hash)).toBeNull();
    });

    it('reports outbox size and the oldest eligibility marker', async () => {
      // verifies spec: CAP — surfaced as a health signal
      const eligible = await putOutbox();
      await putOutbox(); // stays unsynced → no marker
      await putCache(); // cache blobs are outside the outbox
      const pusher = makeCyclePusher(eligible.hash);
      await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PUSH, '42');
      await pusher.recordSyncCycle();

      const status = await blobOutboxStatus(models);

      expect(status.count).toBe(2);
      expect(status.totalBytes).toBeGreaterThan(0);
      expect(status.oldestEligibleTick).toBe(42);
    });
  });

  describe('synced reference resolver eligibility', () => {
    // A throwaway stand-in for a consumer table (attachments arrive in a later
    // card); rows carry a hash and a raw sync tick, no triggers.
    const TABLE = 'blob_ref_resolver_test';
    let originalPushCursor;

    beforeEach(async () => {
      originalPushCursor = await models.LocalSystemFact.get(FACT_LAST_SUCCESSFUL_SYNC_PUSH);
      await models.Blob.sequelize.query(
        `CREATE TABLE IF NOT EXISTS ${TABLE} (hash text, updated_at_sync_tick bigint)`,
      );
      await models.Blob.sequelize.query(`TRUNCATE ${TABLE}`);
    });

    afterEach(async () => {
      await models.Blob.sequelize.query(`DROP TABLE IF EXISTS ${TABLE}`);
      if (originalPushCursor == null) {
        await models.LocalSystemFact.destroy({
          where: { key: FACT_LAST_SUCCESSFUL_SYNC_PUSH },
          force: true,
        });
      } else {
        await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PUSH, originalPushCursor);
      }
    });

    const seed = async records => {
      for (const [hash, tick] of records) {
        await models.Blob.sequelize.query(
          `INSERT INTO ${TABLE} (hash, updated_at_sync_tick) VALUES (:hash, :tick)`,
          { replacements: { hash, tick } },
        );
      }
    };

    it('is synced only when pushed (positive tick at or under the cursor) or arrived from elsewhere', async () => {
      // verifies spec: CACHE — the eligibility gate; flag ticks are not "pushed"
      await seed([
        ['pushed', 5], // eligible: a real tick at or below the push cursor
        ['fromElsewhere', -999], // eligible: LAST_UPDATED_ELSEWHERE
        ['notYetPushed', 50], // not eligible: tick above the cursor
        ['incomingFlag', -1], // not eligible: INCOMING_FROM_CENTRAL_SERVER flag
        ['overwriteFlag', 0], // not eligible: OVERWRITE_WITH_CURRENT_TICK flag
      ]);
      await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PUSH, '10');

      const resolve = makeSyncedReferenceResolver({ tableName: TABLE, hashColumn: 'hash' });
      const eligible = await resolve(models, [
        'pushed',
        'fromElsewhere',
        'notYetPushed',
        'incomingFlag',
        'overwriteFlag',
      ]);

      expect([...eligible].sort()).toEqual(['fromElsewhere', 'pushed']);
    });

    it('treats nothing as pushed before the first successful push completes', async () => {
      // verifies spec: CACHE — with no push cursor, only from-elsewhere records qualify
      await seed([
        ['pushed', 5],
        ['fromElsewhere', -999],
      ]);
      await models.LocalSystemFact.destroy({
        where: { key: FACT_LAST_SUCCESSFUL_SYNC_PUSH },
        force: true,
      });

      const resolve = makeSyncedReferenceResolver({ tableName: TABLE, hashColumn: 'hash' });
      const eligible = await resolve(models, ['pushed', 'fromElsewhere']);

      expect(eligible).toEqual(['fromElsewhere']);
    });

    it('returns nothing for an empty candidate list without querying', async () => {
      const resolve = makeSyncedReferenceResolver({ tableName: TABLE, hashColumn: 'hash' });
      expect(await resolve(models, [])).toEqual([]);
    });

    it('rejects a malformed identifier rather than interpolating it', () => {
      expect(() =>
        makeSyncedReferenceResolver({
          tableName: 'attachments; DROP TABLE blobs',
          hashColumn: 'hash',
        }),
      ).toThrow(/Unsafe SQL identifier/);
    });
  });
});
