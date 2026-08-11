import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';

import { FACILITY_PARITY_TIERS, parityGeometry } from '@tamanu/blobs';
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
  let errorCorrection;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
  });

  afterAll(() => ctx.close());

  beforeEach(async () => {
    await models.Blob.destroy({ where: {}, force: true });
    await models.BlobQuarantine.destroy({ where: {}, force: true });
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'blob-integrity-test-'));
    // Off by default, as on a server that has not enabled it; the parity cases
    // below switch it on before they admit anything.
    errorCorrection = { enabled: false, proportion: 0.1 };
    blobStore = new BlobStore({
      root,
      models,
      getFreeDiskReserveBytes: async () => 0,
      errorCorrection: {
        coveredTiers: FACILITY_PARITY_TIERS,
        getSettings: async () => errorCorrection,
      },
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

    it('retains a corrupt outbox blob rather than dropping the only copy', async () => {
      const { hash } = await put(BLOB_TIERS.OUTBOX);
      await corrupt(hash);

      await makeScrubber().run();

      const blob = await models.Blob.findOne({ where: { hash } });
      expect(blob.integrityState).toBe(BLOB_INTEGRITY_STATES.CORRUPT);
      // Retained for investigation, per the spec: the bytes are still there.
      await expect(fs.access(pathOf(hash))).resolves.toBeUndefined();
    });

    // verifies spec: AV, SCRUB — every repair below ends in the same bytes being
    // held again, which for content the deployment has recorded as malware is
    // the one outcome to avoid. A cache copy would otherwise be dropped and
    // refetched, which is exactly resurrecting it.
    it('leaves a quarantined cache blob unrepaired rather than refetching it', async () => {
      const { hash } = await put(BLOB_TIERS.CACHE);
      await models.BlobQuarantine.create({ hash });
      await corrupt(hash);

      await makeScrubber().run();

      // Neither dropped nor refetched: the healer declined to touch it.
      expect(await models.Blob.findOne({ where: { hash } })).not.toBeNull();
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

    it('leaves an outbox blob corrupt when central cannot supply it', async () => {
      const { hash } = await put(BLOB_TIERS.OUTBOX);
      await corrupt(hash);
      blobHealer.setTransferChannel({
        fetchFromCentral: async () => {
          throw new Error('central does not hold it');
        },
      });

      await makeScrubber().run();

      const blob = await models.Blob.findOne({ where: { hash } });
      expect(blob.integrityState).toBe(BLOB_INTEGRITY_STATES.CORRUPT);
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
      // be assumed a refetchable replica: it must be retained, not let the
      // cache path drop it.
      const { hash } = await put(BLOB_TIERS.CACHE);
      await corrupt(hash);
      await models.Blob.destroy({ where: { hash }, force: true });

      const result = await makeScrubber().run();

      expect(result.faults).toBe(1);
      const blob = await models.Blob.findOne({ where: { hash } });
      expect(blob.integrityState).toBe(BLOB_INTEGRITY_STATES.CORRUPT);
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
  // spec: FEC
  describe('error correction', () => {
    // 16+2 shards of 4 KiB, so two damaged shards are the budget and three are past it.
    const COVERED_BYTES = 64 * 1024;
    const geometry = parityGeometry(COVERED_BYTES, 0.1);

    const coveredContent = () => {
      const blob = Buffer.alloc(COVERED_BYTES);
      let state = blob.length;
      for (let offset = 0; offset < blob.length; offset++) {
        state = (state * 1103515245 + 12345) & 0x7fffffff;
        blob[offset] = (state >>> 16) & 0xff;
      }
      return blob;
    };

    // Bit rot over whole shards: the bytes change, the path and the row do not.
    const damageShards = async (hash, shards) => {
      const handle = await fs.open(pathOf(hash), 'r+');
      try {
        for (const shard of shards) {
          await handle.write(
            Buffer.alloc(geometry.shardSize, `x${shard}`),
            0,
            geometry.shardSize,
            shard * geometry.shardSize,
          );
        }
      } finally {
        await handle.close();
      }
    };

    beforeEach(() => {
      errorCorrection = { enabled: true, proportion: 0.1 };
    });

    it('repairs a corrupt outbox blob in place instead of recording it corrupt', async () => {
      const content = coveredContent();
      const { hash } = await put(BLOB_TIERS.OUTBOX, content);
      await damageShards(hash, [6]);

      await makeScrubber().run();

      // The scrub counts the detection; what matters is that the ladder resolved
      // it, which is what the registry records and the health signals read.
      const row = await models.Blob.findOne({ where: { hash } });
      expect(row.integrityState).toBe(BLOB_INTEGRITY_STATES.VERIFIED);
      expect(row.correctionCount).toBe(1);
      expect(row.lastCorrectedAt).toBeTruthy();
      expect(await readAll(await blobStore.get(hash))).toEqual(content);
    });

    it('records an outbox blob damaged beyond the parity budget corrupt', async () => {
      const { hash } = await put(BLOB_TIERS.OUTBOX, coveredContent());
      await damageShards(hash, [1, 5, 9]);

      const result = await makeScrubber().run();

      expect(result.faults).toBe(1);
      const row = await models.Blob.findOne({ where: { hash } });
      expect(row.integrityState).toBe(BLOB_INTEGRITY_STATES.CORRUPT);
      expect(row.correctionCount).toBe(0);
    });

    // verifies spec: AV, FEC — quarantined content is retained but never served
    // and never repaired, so the retrofit spends no disk protecting it.
    it('writes no parity for content quarantined as malware', async () => {
      const { hash } = await put(BLOB_TIERS.OUTBOX, coveredContent());
      await models.Blob.update({ hasParity: false }, { where: { hash } });
      await fs.rm(`${pathOf(hash)}.parity`, { force: true });
      await models.BlobQuarantine.create({ hash });

      const result = await makeScrubber().run();

      expect(result.protected).toBe(0);
      await expect(fs.access(`${pathOf(hash)}.parity`)).rejects.toThrow();
      expect((await models.Blob.findOne({ where: { hash } })).hasParity).toBe(false);
    });

    it('leaves a cache blob to refetch, since a facility carries no parity for one', async () => {
      const { hash } = await put(BLOB_TIERS.CACHE, coveredContent());
      await damageShards(hash, [2]);

      await makeScrubber().run();

      // Uncovered, so there was nothing to repair from and the ordinary cache
      // grading applies: drop it and refetch on demand.
      expect(await models.Blob.findOne({ where: { hash } })).toBeNull();
    });
  });
});
