import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';

import { BLOB_INTEGRITY_STATES, BLOB_TIERS } from '@tamanu/constants';
import { BlobScrubber, BlobStore } from '@tamanu/database/blobStore';
import { BlobHashMismatchError } from '@tamanu/errors';

import { createTestContext } from '../utilities';
import { FacilityBlobHealer } from '../../app/blobIntegrity/FacilityBlobHealer';

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
  for (;;) {
    if (await predicate()) return;
    if (Date.now() > deadline) throw new Error('waitFor timed out');
    await new Promise(resolve => {
      setTimeout(resolve, 10);
    });
  }
}

describe('facility blob integrity', () => {
  let ctx;
  let models;
  let root;
  let blobStore;
  let blobHealer;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
  });

  afterAll(() => ctx.close());

  beforeEach(async () => {
    await models.Blob.destroy({ where: {}, force: true });
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'blob-integrity-test-'));
    blobStore = new BlobStore({
      root,
      models,
      getFreeDiskReserveBytes: async () => 0,
      onCorruptionDetected: async hash => {
        await blobHealer.heal({
          hash,
          fault: 'corrupt',
          blob: await models.Blob.findOne({ where: { hash } }),
        });
      },
    });
    blobHealer = new FacilityBlobHealer({ blobStore, models });
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  const makeScrubber = ({ maxBlobs = 100, maxBytes = 1024 ** 3 } = {}) =>
    new BlobScrubber({
      blobStore,
      models,
      getLimits: async () => ({ maxBlobs, maxBytes }),
      heal: report => blobHealer.heal(report),
      log: { info: () => {}, warn: () => {} },
    });

  const put = async (tier, content = uniqueContent()) => {
    const { hash } = await blobStore.put(Readable.from(content), { tier });
    return { hash, content };
  };

  const pathOf = hash => {
    const digest = hash.split(':')[1];
    return path.join(root, 'sha256', digest.slice(0, 2), digest.slice(2, 4), digest.slice(4));
  };

  const corrupt = async hash => fs.writeFile(pathOf(hash), uniqueContent());

  // spec: SCRUB
  describe('grading by tier', () => {
    it('drops a corrupt cache blob so the next read refetches it', async () => {
      const { hash } = await put(BLOB_TIERS.CACHE);
      await corrupt(hash);

      await makeScrubber().run();

      expect(await models.Blob.findOne({ where: { hash } })).toBeNull();
      await expect(fs.access(pathOf(hash))).rejects.toThrow();
    });

    it('quarantines a corrupt outbox blob rather than dropping the only copy', async () => {
      const { hash } = await put(BLOB_TIERS.OUTBOX);
      await corrupt(hash);

      await makeScrubber().run();

      const blob = await models.Blob.findOne({ where: { hash } });
      expect(blob.integrityState).toBe(BLOB_INTEGRITY_STATES.QUARANTINED);
      // Retained for investigation, per the spec: the bytes are still there.
      await expect(fs.access(pathOf(hash))).resolves.toBeUndefined();
    });

    it('marks an outbox blob whose bytes have gone as absent', async () => {
      const { hash } = await put(BLOB_TIERS.OUTBOX);
      await fs.rm(pathOf(hash));

      await makeScrubber().run();

      const blob = await models.Blob.findOne({ where: { hash } });
      expect(blob.integrityState).toBe(BLOB_INTEGRITY_STATES.ABSENT);
    });

    it('repairs an outbox blob from central where central turns out to hold it', async () => {
      const { hash, content } = await put(BLOB_TIERS.OUTBOX);
      await corrupt(hash);
      blobHealer.setTransferChannel({
        fetchFromCentral: async fetched => {
          await blobStore.stage(fetched, Readable.from(content), { offset: 0 });
          return await blobStore.commitStaged(fetched);
        },
      });

      await makeScrubber().run();

      const blob = await models.Blob.findOne({ where: { hash } });
      expect(blob.integrityState).toBe(BLOB_INTEGRITY_STATES.VERIFIED);
      // Central had it, so it is a replica now rather than the only copy.
      expect(blob.tier).toBe(BLOB_TIERS.CACHE);
      expect((await readAll(await blobStore.get(hash))).equals(content)).toBe(true);
    });

    it('leaves an outbox blob quarantined when central cannot supply it', async () => {
      const { hash } = await put(BLOB_TIERS.OUTBOX);
      await corrupt(hash);
      blobHealer.setTransferChannel({
        fetchFromCentral: async () => {
          throw new Error('central does not hold it');
        },
      });

      await makeScrubber().run();

      const blob = await models.Blob.findOne({ where: { hash } });
      expect(blob.integrityState).toBe(BLOB_INTEGRITY_STATES.QUARANTINED);
    });
  });

  // spec: SCRUB
  describe('scrub scheduling against the real registry', () => {
    it('takes never-scrubbed blobs before ones scrubbed long ago', async () => {
      const stale = await put(BLOB_TIERS.CACHE);
      const never = await put(BLOB_TIERS.CACHE);
      await models.Blob.update(
        { lastScrubbedAt: new Date('2020-01-01T00:00:00Z') },
        { where: { hash: stale.hash } },
      );
      await models.Blob.update({ lastScrubbedAt: null }, { where: { hash: never.hash } });

      await makeScrubber({ maxBlobs: 1 }).run();

      const neverRow = await models.Blob.findOne({ where: { hash: never.hash } });
      const staleRow = await models.Blob.findOne({ where: { hash: stale.hash } });
      expect(neverRow.lastScrubbedAt).not.toBeNull();
      expect(staleRow.lastScrubbedAt.toISOString()).toBe('2020-01-01T00:00:00.000Z');
    });

    it('covers the whole store across successive passes', async () => {
      const hashes = [];
      for (let i = 0; i < 3; i++) {
        hashes.push((await put(BLOB_TIERS.CACHE)).hash);
      }
      await models.Blob.update({ lastScrubbedAt: null }, { where: {} });

      const scrubber = makeScrubber({ maxBlobs: 1 });
      await scrubber.run();
      await scrubber.run();
      await scrubber.run();

      const unscrubbed = await models.Blob.count({ where: { lastScrubbedAt: null } });
      expect(unscrubbed).toBe(0);
    });

    it('registers bytes left on disk by an interrupted admission', async () => {
      const { hash, content } = await put(BLOB_TIERS.CACHE);
      // Exactly what a crash between placing the file and recording it leaves.
      await models.Blob.destroy({ where: { hash }, force: true });

      const result = await makeScrubber().run();

      expect(result.adopted).toBe(1);
      const blob = await models.Blob.findOne({ where: { hash } });
      expect(blob.size).toBe(content.length);
      expect(blob.integrityState).toBe(BLOB_INTEGRITY_STATES.VERIFIED);
    });

    it('restores an absent blob to verified once its bytes return', async () => {
      // A registry row left absent by an earlier loss, whose bytes are then
      // back on disk (a backup restore). The scrub notices and flips it back
      // rather than leaving usable content marked absent forever.
      const { hash } = await put(BLOB_TIERS.CACHE);
      await models.Blob.update(
        { integrityState: BLOB_INTEGRITY_STATES.ABSENT },
        { where: { hash } },
      );

      const result = await makeScrubber().run();

      expect(result.verified).toBe(1);
      const blob = await models.Blob.findOne({ where: { hash } });
      expect(blob.integrityState).toBe(BLOB_INTEGRITY_STATES.VERIFIED);
    });

    it('re-checks a still-absent blob without re-escalating it', async () => {
      const { hash } = await put(BLOB_TIERS.CACHE);
      await fs.rm(pathOf(hash));
      await models.Blob.update(
        { integrityState: BLOB_INTEGRITY_STATES.ABSENT, lastScrubbedAt: new Date('2020-01-01T00:00:00Z') },
        { where: { hash } },
      );

      const result = await makeScrubber().run();

      expect(result.faults).toBe(0);
      const blob = await models.Blob.findOne({ where: { hash } });
      expect(blob.integrityState).toBe(BLOB_INTEGRITY_STATES.ABSENT);
      // Re-stamped so it doesn't monopolise the next pass's scan.
      expect(blob.lastScrubbedAt.getTime()).toBeGreaterThan(new Date('2020-01-01T00:00:00Z').getTime());
    });

    it('retains a corrupt orphan rather than the cache healer deleting it', async () => {
      // A corrupt orphan has no reference and no known provenance, so it cannot
      // be assumed a refetchable replica: quarantine must retain it, not let the
      // cache path drop it.
      const { hash } = await put(BLOB_TIERS.CACHE);
      await corrupt(hash);
      await models.Blob.destroy({ where: { hash }, force: true });

      const result = await makeScrubber().run();

      expect(result.faults).toBe(1);
      const blob = await models.Blob.findOne({ where: { hash } });
      expect(blob.integrityState).toBe(BLOB_INTEGRITY_STATES.QUARANTINED);
      // The bytes are retained on disk for investigation, not deleted.
      await expect(fs.access(pathOf(hash))).resolves.toBeUndefined();
    });
  });

  // The application context resolves the scrub's per-pass bounds through this
  // settings path, and a typo in it would only surface when a scheduled pass
  // first ran on a real server.
  describe('scrub settings', () => {
    it('resolves the per-pass bounds the context reads', async () => {
      const [facilityId] = Object.keys(ctx.settings).filter(key => key !== 'global');
      const scrub = await ctx.settings[facilityId].get('schedules.blobIntegrityScrub');

      expect(scrub.maxBlobsPerPass).toBeGreaterThan(0);
      expect(scrub.maxGigabytesPerPass).toBeGreaterThan(0);
      expect(scrub.schedule).toEqual(expect.any(String));
    });
  });

  // spec: SCRUB
  describe('read verification', () => {
    it('fails the read and heals when stored bytes no longer match', async () => {
      const { hash } = await put(BLOB_TIERS.CACHE);
      await corrupt(hash);

      await expect(readAll(await blobStore.get(hash))).rejects.toThrow(BlobHashMismatchError);
      // The cache grading applies on the read path too, so it is gone and will
      // refetch rather than being served corrupt a second time. Healing runs
      // clear of the read, so the reader gets its error without waiting on the
      // repair — hence waiting for it here rather than asserting immediately.
      await waitFor(async () => (await models.Blob.findOne({ where: { hash } })) === null);
    });
  });
});
