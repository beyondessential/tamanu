import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';

import { BLOB_SCAN_VERDICTS, BLOB_SCANNERS } from '@tamanu/constants';
import { createScannerDriver } from '@tamanu/database/blobStore';
import { settingsCache } from '@tamanu/settings';

import { createTestContext } from './utilities';
import { ApplicationContext } from '../app/ApplicationContext';

// The host daemon is the one part of a scan the context cannot supply, so the
// driver is replaced and everything above it is the context's own wiring.
jest.mock('@tamanu/database/blobStore', () => ({
  ...jest.requireActual('@tamanu/database/blobStore'),
  createScannerDriver: jest.fn(),
}));

const VERSIONS = { scannerVersion: 'test-scanner 1.0', signatureVersion: '27100' };

// 16+2 shards of 4 KiB at the default proportion, so the content is large
// enough for the store to cover it with parity.
const COVERED_BYTES = 64 * 1024;

const coveredContent = () => {
  const blob = Buffer.alloc(COVERED_BYTES);
  let state = Date.now() & 0x7fffffff;
  for (let offset = 0; offset < blob.length; offset++) {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    blob[offset] = (state >>> 16) & 0xff;
  }
  return blob;
};

// The scheduled scrub and antivirus pass as the central application context
// builds them: the settings each reads, and what an infected verdict does.
describe('central scheduled blob passes', () => {
  let ctx;
  let models;
  let appContext;
  let root;
  let verdict;

  const setSetting = async (key, value) => {
    await models.Setting.set(key, value);
    settingsCache.reset();
  };

  const pathOf = hash => {
    const digest = hash.split(':')[1];
    return path.join(root, 'sha256', digest.slice(0, 2), digest.slice(2, 4), digest.slice(4));
  };

  const admit = async (content = Buffer.from(`blob content ${randomUUID()}`)) => {
    const { hash } = await appContext.blobStore.put(Readable.from(content));
    return { hash, content };
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;

    root = await fs.mkdtemp(path.join(os.tmpdir(), 'central-scheduled-passes-'));
    await models.Setting.set('blobStorage.root', root);
    await models.Setting.set('blobStorage.freeDiskReserveGB', 0);
    await models.Setting.set('blobStorage.errorCorrection', {
      enabled: true,
      parityPercent: 10,
    });
    await models.Setting.set('blobStorage.antivirus.scanner', BLOB_SCANNERS.CLAMD);
    settingsCache.reset();

    createScannerDriver.mockReturnValue({
      versions: async () => VERSIONS,
      scan: async () => verdict,
    });

    appContext = await new ApplicationContext().init();
  });

  afterAll(async () => {
    for (const key of [
      'blobStorage.root',
      'blobStorage.freeDiskReserveGB',
      'blobStorage.errorCorrection',
      'blobStorage.antivirus.scanner',
      'schedules.blobIntegrityScrub.maxBlobsPerPass',
      'schedules.blobAntivirusScan.maxBlobsPerPass',
    ]) {
      await models.Setting.destroy({ where: { key }, force: true });
    }
    settingsCache.reset();
    await appContext.close();
    await fs.rm(root, { recursive: true, force: true });
    await ctx.close();
  });

  beforeEach(async () => {
    verdict = BLOB_SCAN_VERDICTS.CLEAN;
    await models.Blob.destroy({ where: {}, force: true });
    await models.BlobQuarantine.destroy({ where: {}, force: true });
    // Bytes left behind would be adopted as orphans by the scrub's
    // reconciliation and counted alongside the blobs a case admits itself.
    await fs.rm(path.join(root, 'sha256'), { recursive: true, force: true });
  });

  // verifies spec: AV, FEC — a quarantined blob is never served and never
  // repaired, so the disk its parity occupies is protecting content nothing
  // will ever reconstruct.
  it('discards a blob’s parity when the scan finds it infected', async () => {
    const { hash } = await admit(coveredContent());
    expect((await models.Blob.findOne({ where: { hash } })).hasParity).toBe(true);
    verdict = BLOB_SCAN_VERDICTS.INFECTED;

    await appContext.blobScanner.run();

    expect(await models.BlobQuarantine.findOne({ where: { hash } })).not.toBeNull();
    expect((await models.Blob.findOne({ where: { hash } })).hasParity).toBe(false);
    await expect(fs.access(`${pathOf(hash)}.parity`)).rejects.toThrow();
  });

  it('leaves parity alone for a blob the scan finds clean', async () => {
    const { hash } = await admit(coveredContent());

    await appContext.blobScanner.run();

    expect(await models.BlobQuarantine.findOne({ where: { hash } })).toBeNull();
    expect((await models.Blob.findOne({ where: { hash } })).hasParity).toBe(true);
    await expect(fs.access(`${pathOf(hash)}.parity`)).resolves.toBeUndefined();
  });

  // The per-pass bounds are read through a settings path each pass, and a typo
  // in one would only surface when a scheduled pass first ran on a real server.
  describe('per-pass bounds from settings', () => {
    it('bounds the scrub by the blobs-per-pass setting', async () => {
      for (let i = 0; i < 3; i++) await admit();

      await setSetting('schedules.blobIntegrityScrub.maxBlobsPerPass', 1);
      expect((await appContext.blobScrubber.run()).verified).toBe(1);

      await setSetting('schedules.blobIntegrityScrub.maxBlobsPerPass', 2);
      expect((await appContext.blobScrubber.run()).verified).toBe(2);
    });

    it('bounds the scan by its own blobs-per-pass setting', async () => {
      for (let i = 0; i < 3; i++) await admit();

      await setSetting('schedules.blobAntivirusScan.maxBlobsPerPass', 1);
      expect((await appContext.blobScanner.run()).scanned).toBe(1);

      await setSetting('schedules.blobAntivirusScan.maxBlobsPerPass', 2);
      expect((await appContext.blobScanner.run()).scanned).toBe(2);
    });
  });
});
