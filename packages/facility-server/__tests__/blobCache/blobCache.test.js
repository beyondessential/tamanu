import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';

import { FACILITY_PARITY_TIERS, PARITY_SIDECAR_SUFFIX } from '@tamanu/blobs';
import { BLOB_INTEGRITY_STATES, BLOB_SCAN_VERDICTS, BLOB_TIERS } from '@tamanu/constants';
import { FACT_LAST_SUCCESSFUL_SYNC_PUSH } from '@tamanu/constants/facts';
import { BlobStore } from '@tamanu/database/blobStore';
import { log } from '@tamanu/shared/services/logging';

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
    await models.BlobQuarantine.destroy({ where: {}, force: true });
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'blob-cache-test-'));
    cacheBudgetBytes = 10 * GB;
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

  const markInfected = hash =>
    blobStore.recordScanVerdict(hash, {
      verdict: BLOB_SCAN_VERDICTS.INFECTED,
      scannerVersion: 'test',
      signatureVersion: 'test',
    });

  const tierOf = async hash => (await models.Blob.findOne({ where: { hash } })).tier;

  const sidecarPathFor = hash => {
    const digest = hash.split(':')[1];
    return path.join(
      root,
      'sha256',
      digest.slice(0, 2),
      digest.slice(2, 4),
      `${digest.slice(4)}${PARITY_SIDECAR_SUFFIX}`,
    );
  };

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

    it('returns cache-tier content to the outbox when it is admitted locally', async () => {
      // verifies spec: CACHE
      const content = uniqueContent();
      await putCache(content);
      const { hash } = await putOutbox(content);
      expect(await tierOf(hash)).toBe(BLOB_TIERS.OUTBOX);
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
      // verifies spec: FEC
      errorCorrection = { enabled: true, proportion: 0.1 };
      const { hash } = await putOutbox(Buffer.alloc(64 * 1024, 'o'));
      const sidecar = sidecarPathFor(hash);
      await expect(fs.access(sidecar)).resolves.toBeUndefined();

      await blobCache.demote(hash);

      await expect(fs.access(sidecar)).rejects.toThrow();
      const row = await models.Blob.findOne({ where: { hash } });
      expect(row.tier).toBe(BLOB_TIERS.CACHE);
      expect(row.hasParity).toBe(false);
    });

    it('covers content promoted back to the outbox with parity again', async () => {
      // verifies spec: FEC
      errorCorrection = { enabled: true, proportion: 0.1 };
      const content = Buffer.alloc(64 * 1024, 'p');
      const { hash } = await putOutbox(content);
      await blobCache.demote(hash);
      await expect(fs.access(sidecarPathFor(hash))).rejects.toThrow();

      await blobCache.putOutbox(Readable.from(content));

      await expect(fs.access(sidecarPathFor(hash))).resolves.toBeUndefined();
      expect((await models.Blob.findOne({ where: { hash } })).hasParity).toBe(true);
    });
  });

  describe('read-through open', () => {
    it('serves local bytes and refreshes stale recency', async () => {
      // verifies spec: CACHE
      const { hash, content } = await putCache();
      await setLastAccessed(hash, 10 * 60 * 1000);

      const served = await readAll(await blobCache.open(hash));
      expect(served.equals(content)).toBe(true);

      const row = await models.Blob.findOne({ where: { hash } });
      expect(Date.now() - row.lastAccessedAt.getTime()).toBeLessThan(60 * 1000);
    });

    it('coalesces recency updates within the window', async () => {
      // verifies spec: CACHE
      const { hash } = await putCache();
      await setLastAccessed(hash, 30 * 1000);
      const before = (await models.Blob.findOne({ where: { hash } })).lastAccessedAt;

      await readAll(await blobCache.open(hash));

      const after = (await models.Blob.findOne({ where: { hash } })).lastAccessedAt;
      expect(after.getTime()).toBe(before.getTime());
    });

    it('fetches from central on a local miss, then serves', async () => {
      // verifies spec: CACHE, XFER
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

    // spec: SCRUB, CACHE
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

    it('evicts least-recently-used content when a fetch takes the cache over budget', async () => {
      // verifies spec: CACHE
      const stale = await putCache();
      const recent = await putCache();
      await setLastAccessed(stale.hash, 3 * 60 * 60 * 1000);
      await setLastAccessed(recent.hash, 60 * 60 * 1000);

      const content = uniqueContent();
      const hash = hashOf(content);
      cacheBudgetBytes = recent.content.length + content.length;
      blobCache.setTransferChannel({
        fetchFromCentral: async () => await blobStore.put(Readable.from(content)),
      });

      const served = await readAll(await blobCache.open(hash));

      expect(served.equals(content)).toBe(true);
      expect(await blobStore.has(hash)).toBe(true);
      expect(await blobStore.has(stale.hash)).toBe(false);
      expect(await blobStore.has(recent.hash)).toBe(true);
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
      cacheBudgetBytes = middle.content.length + newest.content.length;

      await blobCache.enforceBudget();

      expect(await blobStore.has(oldest.hash)).toBe(false);
      expect(await blobStore.has(middle.hash)).toBe(true);
      expect(await blobStore.has(newest.hash)).toBe(true);
    });

    it('never evicts the most recently used blob merely to satisfy the budget', async () => {
      // verifies spec: CACHE
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
      // The open refreshed recency; re-pin it as the LRU so only the active read protects it.
      await setLastAccessed(oldest.hash, 2 * 60 * 60 * 1000);

      await blobCache.enforceBudget();
      expect(await blobStore.has(oldest.hash)).toBe(true);

      await readAll(inProgress);
      await waitFor(() => inProgress.closed);
      await blobCache.enforceBudget();
      expect(await blobStore.has(oldest.hash)).toBe(false);
    });

    it('evicts even the most recently used blob under free-disk floor pressure', async () => {
      // verifies spec: CAP
      const only = await putCache();

      const result = await blobCache.evictBytes(1);

      expect(result.evictedCount).toBe(1);
      expect(await blobStore.has(only.hash)).toBe(false);
    });

    it('applies a budget change on the next enforcement pass', async () => {
      // verifies spec: CACHE
      const blob = await putCache();
      await setLastAccessed(blob.hash, 2 * 60 * 60 * 1000);
      await putCache();
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
      // verifies spec: CACHE
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
      // verifies spec: CACHE
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
      // verifies spec: CACHE
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
      await waitFor(() => attempts === 1);
      const secondRun = pusher.runOnce();

      resolvePush();
      await Promise.all([firstRun, secondRun]);

      expect(attempts).toBe(1);
      expect(await tierOf(hash)).toBe(BLOB_TIERS.CACHE);
    });

    it('leaves a blob in the outbox when a push returns without acknowledgement', async () => {
      // verifies spec: CACHE
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
      // spec: XFER
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
      expect(await tierOf(hash)).toBe(BLOB_TIERS.OUTBOX);
    });

    it('withholds content this facility found infected, keeping it in the outbox', async () => {
      // verifies spec: AV
      const infected = await putOutbox();
      const clean = await putOutbox();
      await markInfected(infected.hash);
      const pushed = [];
      const pusher = makePusher({
        resolvers: [eligibleAll],
        pushToCentral: async hash => {
          pushed.push(hash);
          return { acknowledged: true };
        },
      });

      await pusher.runOnce();

      expect(pushed).toEqual([clean.hash]);
      expect(await tierOf(infected.hash)).toBe(BLOB_TIERS.OUTBOX);
      expect(await readAll(await blobStore.get(infected.hash))).toEqual(infected.content);
    });

    it('withholds quarantined content, keeping it in the outbox', async () => {
      // verifies spec: AV
      const quarantined = await putOutbox();
      const clean = await putOutbox();
      await models.BlobQuarantine.create({ hash: quarantined.hash });
      const pushed = [];
      const pusher = makePusher({
        resolvers: [eligibleAll],
        pushToCentral: async hash => {
          pushed.push(hash);
          return { acknowledged: true };
        },
      });

      await pusher.runOnce();

      expect(pushed).toEqual([clean.hash]);
      expect(await tierOf(quarantined.hash)).toBe(BLOB_TIERS.OUTBOX);
      expect(await readAll(await blobStore.get(quarantined.hash))).toEqual(quarantined.content);
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
      // verifies spec: CAP
      const eligible = await putOutbox();
      const unsynced = await putOutbox();
      const pusher = makeCyclePusher(eligible.hash);

      await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PUSH, '100');
      await pusher.recordSyncCycle();
      expect(await eligibleSinceOf(eligible.hash)).toBe(100);
      expect(await eligibleSinceOf(unsynced.hash)).toBeNull();

      await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PUSH, '200');
      await pusher.recordSyncCycle();
      expect(await eligibleSinceOf(eligible.hash)).toBe(100);
      expect(await eligibleSinceOf(unsynced.hash)).toBeNull();
    });

    it('clears the marker when a pushed blob is demoted', async () => {
      // verifies spec: CACHE
      const { hash } = await putOutbox();
      const pusher = makeCyclePusher(hash);
      await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PUSH, '5');
      await pusher.recordSyncCycle();
      expect(await eligibleSinceOf(hash)).toBe(5);

      await blobCache.demote(hash);
      expect(await eligibleSinceOf(hash)).toBeNull();
    });

    it('reports outbox size and the oldest eligibility marker', async () => {
      // verifies spec: CAP
      const eligible = await putOutbox();
      await putOutbox();
      await putCache();
      const pusher = makeCyclePusher(eligible.hash);
      await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PUSH, '42');
      await pusher.recordSyncCycle();

      const status = await blobOutboxStatus(models);

      expect(status.count).toBe(2);
      expect(status.totalBytes).toBeGreaterThan(0);
      expect(status.oldestEligibleTick).toBe(42);
    });

    it('leaves withheld content out of the outbox status', async () => {
      // verifies spec: CAP
      const { hash } = await putOutbox();
      const pusher = makeCyclePusher(hash);
      await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PUSH, '42');
      await pusher.recordSyncCycle();
      await markInfected(hash);

      const status = await blobOutboxStatus(models);

      expect(status).toEqual({ count: 0, totalBytes: 0, oldestEligibleTick: null });
    });

    describe('escalation', () => {
      let errorLog;

      beforeEach(() => {
        errorLog = vi.spyOn(log, 'error').mockImplementation(() => {});
      });

      afterEach(() => {
        errorLog.mockRestore();
      });

      const dysfunctionCalls = () =>
        errorLog.mock.calls.filter(([message]) => /outbox dysfunction/i.test(message));

      const eligibleSince = async (pusher, tick) => {
        await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PUSH, String(tick));
        await pusher.recordSyncCycle();
        errorLog.mockClear();
      };

      it('escalates a blob left unpushed across several successful syncs', async () => {
        // verifies spec: CAP
        const { hash } = await putOutbox();
        const pusher = makeCyclePusher(hash);
        await eligibleSince(pusher, 10);

        await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PUSH, '100');
        await pusher.recordSyncCycle();

        expect(dysfunctionCalls()).toHaveLength(1);
        expect(dysfunctionCalls()[0][1]).toMatchObject({
          ticksSinceEligible: 90,
          outboxCount: 1,
        });
      });

      it('does not escalate infected content withheld in the outbox', async () => {
        // verifies spec: CAP
        const { hash } = await putOutbox();
        const pusher = makeCyclePusher(hash);
        await eligibleSince(pusher, 10);
        await markInfected(hash);

        await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PUSH, '100');
        await pusher.recordSyncCycle();

        expect(dysfunctionCalls()).toHaveLength(0);
      });

      it('stays quiet while a blob has only just become eligible', async () => {
        // verifies spec: CAP
        const { hash } = await putOutbox();
        const pusher = makeCyclePusher(hash);
        await eligibleSince(pusher, 10);

        await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PUSH, '12');
        await pusher.recordSyncCycle();

        expect(dysfunctionCalls()).toHaveLength(0);
      });

      it('treats a blob whose transfer is in flight as healthy accumulation', async () => {
        // verifies spec: CAP
        const { hash } = await putOutbox();
        let resolvePush;
        let attempts = 0;
        const pusher = new BlobOutboxPusher({
          models,
          transferChannel: {
            pushToCentral: () => {
              attempts += 1;
              return new Promise(resolve => {
                resolvePush = () => resolve({ acknowledged: true });
              });
            },
          },
          blobCache,
          referenceResolvers: [async (_models, hashes) => hashes.filter(h => h === hash)],
        });
        await eligibleSince(pusher, 10);

        const push = pusher.runOnce();
        await waitFor(() => attempts === 1);
        await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PUSH, '100');
        await pusher.recordSyncCycle();

        expect(dysfunctionCalls()).toHaveLength(0);

        resolvePush();
        await push;
      });
    });
  });

  describe('synced reference resolver eligibility', () => {
    // A stand-in consumer table: rows carry a hash and a raw sync tick, no triggers.
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
      // verifies spec: CACHE
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
      // verifies spec: CACHE
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
