import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';

import { FACILITY_PARITY_TIERS, PARITY_SIDECAR_SUFFIX } from '@tamanu/blobs';
import { BLOB_SCAN_VERDICTS, BLOB_TIERS } from '@tamanu/constants';
import { BlobScanner, BlobStore } from '@tamanu/database/blobStore';

import { createTestContext } from '../utilities';
import { onBlobInfected } from '../../app/blobIntegrity';

// Large enough to carry parity: 16+2 shards of 4 KiB at the default proportion.
const COVERED_BYTES = 64 * 1024;

const coveredContent = () => Buffer.alloc(COVERED_BYTES, randomUUID());

describe('facility antivirus scan', () => {
  let ctx;
  let models;
  let root;
  let blobStore;
  let verdict;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
  });

  afterAll(() => ctx.close());

  beforeEach(async () => {
    await models.Blob.destroy({ where: {}, force: true });
    await models.BlobQuarantine.destroy({ where: {}, force: true });
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'blob-antivirus-test-'));
    verdict = BLOB_SCAN_VERDICTS.INFECTED;
    blobStore = new BlobStore({
      root,
      models,
      getFreeDiskReserveBytes: async () => 0,
      errorCorrection: {
        coveredTiers: FACILITY_PARITY_TIERS,
        getSettings: async () => ({ enabled: true, proportion: 0.1 }),
      },
    });
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  const driver = {
    versions: async () => ({ scannerVersion: 'test-engine 1.0', signatureVersion: '27100' }),
    scan: async () => verdict,
  };

  const makeScanner = () =>
    new BlobScanner({
      blobStore,
      models,
      driver,
      getLimits: async () => ({
        maxBlobs: 100,
        maxBytes: 1024 ** 3,
        maxScanBytes: 1024 ** 3,
      }),
      onInfected: hash => onBlobInfected(blobStore, hash),
      log: { info: () => {}, warn: () => {} },
    });

  const putOutbox = async (content = coveredContent()) => {
    const { hash } = await blobStore.put(Readable.from(content), { tier: BLOB_TIERS.OUTBOX });
    return { hash, content };
  };

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

  // verifies spec: AV — the propagating record names the hash rather than any
  // copy of it, is written by the central server whose verdict is
  // authoritative, and reaches a facility by synchronisation.
  it('leaves the quarantine record alone when its own scan finds malware', async () => {
    const { hash } = await putOutbox();

    const result = await makeScanner().run();

    expect(result).toMatchObject({ scanned: 1, infected: 1 });
    expect(await models.BlobQuarantine.count()).toBe(0);
    const row = await models.Blob.findOne({ where: { hash } });
    expect(row.scanVerdict).toBe(BLOB_SCAN_VERDICTS.INFECTED);
    expect(row.signatureVersion).toBe('27100');
  });

  // verifies spec: AV, FEC — infected content is retained but never served and
  // never repaired, so the disk its parity occupies buys nothing.
  it('discards the parity of content an infected verdict covers', async () => {
    const { hash } = await putOutbox();
    await expect(fs.access(sidecarPathFor(hash))).resolves.toBeUndefined();

    await makeScanner().run();

    await expect(fs.access(sidecarPathFor(hash))).rejects.toThrow();
    expect((await models.Blob.findOne({ where: { hash } })).hasParity).toBe(false);
  });

  it('leaves a clean blob its parity', async () => {
    verdict = BLOB_SCAN_VERDICTS.CLEAN;
    const { hash } = await putOutbox();

    await makeScanner().run();

    await expect(fs.access(sidecarPathFor(hash))).resolves.toBeUndefined();
    expect((await models.Blob.findOne({ where: { hash } })).hasParity).toBe(true);
  });

  // The application context resolves the scan's per-pass bounds and its size cap
  // through these settings paths, and a typo in one would only surface when a
  // scheduled pass first ran on a real server.
  describe('scan settings', () => {
    it('resolves the per-pass bounds and size cap the context reads', async () => {
      const [facilityId] = Object.keys(ctx.settings).filter(key => key !== 'global');
      const scan = await ctx.settings[facilityId].get('schedules.blobAntivirusScan');
      const { maxScanMB } = await ctx.settings[facilityId].get('blobStorage.antivirus');

      expect(scan.maxBlobsPerPass).toBeGreaterThan(0);
      expect(scan.maxGigabytesPerPass).toBeGreaterThan(0);
      expect(scan.schedule).toEqual(expect.any(String));
      expect(maxScanMB).toBeGreaterThan(0);
    });
  });
});
