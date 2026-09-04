import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';

import { BLOB_TIERS } from '@tamanu/constants';
import { BlobStore } from '@tamanu/database/blobStore';

import { createTestContext } from '../utilities';
import { BlobOutboxPusher, FacilityBlobCache } from '../../app/blobCache';
import { BlobCacheEvictorTask } from '../../app/tasks/BlobCacheEvictorTask';
import { BlobOutboxPusherTask } from '../../app/tasks/BlobOutboxPusherTask';

const uniqueContent = () => Buffer.from(`blob content ${randomUUID()}`);

describe('blob cache scheduled tasks', () => {
  let ctx;
  let models;
  let schedules;
  let root;
  let blobStore;
  let blobCache;
  let cacheBudgetBytes;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    schedules = ctx.schedules;
  });

  afterAll(() => ctx.close());

  beforeEach(async () => {
    await models.Blob.destroy({ where: {}, force: true });
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'blob-tasks-test-'));
    cacheBudgetBytes = 10 * 1024 ** 3;
    blobStore = new BlobStore({ root, models, getFreeDiskReserveBytes: async () => 0 });
    blobCache = new FacilityBlobCache({
      blobStore,
      models,
      getCacheBudgetBytes: async () => cacheBudgetBytes,
    });
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  const putCache = async () => {
    const content = uniqueContent();
    const { hash } = await blobStore.put(Readable.from(content));
    return { hash, content };
  };

  const setLastAccessed = async (hash, msAgo) =>
    models.Blob.update(
      { lastAccessedAt: new Date(Date.now() - msAgo) },
      { where: { hash }, silent: true },
    );

  describe('BlobCacheEvictorTask', () => {
    it('brings the cache back within its budget', async () => {
      // verifies spec: CACHE — the budget is enforced by a periodic check as
      // well as at admission
      const stale = await putCache();
      const recent = await putCache();
      await setLastAccessed(stale.hash, 2 * 60 * 60 * 1000);
      cacheBudgetBytes = recent.content.length;

      const ran = await new BlobCacheEvictorTask({ schedules, blobCache }).runImmediately();

      expect(ran).toBe(true);
      expect(await blobStore.has(stale.hash)).toBe(false);
      expect(await blobStore.has(recent.hash)).toBe(true);
    });

    it('demotes an outbox blob left without a referencing record', async () => {
      // verifies spec: CACHE — nothing else reclaims a stranded outbox blob, so
      // the periodic pass demotes it into the budget's reach
      const { hash } = await blobCache.putOutbox(Readable.from(uniqueContent()));
      await setLastAccessed(hash, 2 * 60 * 60 * 1000);

      const ran = await new BlobCacheEvictorTask({ schedules, blobCache }).runImmediately();

      expect(ran).toBe(true);
      expect((await models.Blob.findOne({ where: { hash } })).tier).toBe(BLOB_TIERS.CACHE);
    });

    it('runs cleanly before the blob cache is wired', async () => {
      const ran = await new BlobCacheEvictorTask({ schedules }).runImmediately();

      expect(ran).toBe(true);
    });
  });

  describe('BlobOutboxPusherTask', () => {
    it('drains the outbox', async () => {
      // verifies spec: CACHE — the pusher runs on its own schedule, independent
      // of sync sessions
      const content = uniqueContent();
      const { hash } = await blobCache.putOutbox(Readable.from(content));
      const blobOutboxPusher = new BlobOutboxPusher({
        models,
        transferChannel: { pushToCentral: async () => ({ acknowledged: true }) },
        blobCache,
        referenceResolvers: [async (_models, hashes) => hashes],
      });

      const ran = await new BlobOutboxPusherTask({ schedules, blobOutboxPusher }).runImmediately();

      expect(ran).toBe(true);
      expect((await models.Blob.findOne({ where: { hash } })).tier).toBe(BLOB_TIERS.CACHE);
    });

    it('runs cleanly before the pusher is wired', async () => {
      const ran = await new BlobOutboxPusherTask({ schedules }).runImmediately();

      expect(ran).toBe(true);
    });
  });
});
