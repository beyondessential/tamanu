import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';

import ms from 'ms';

import { BLOB_INTEGRITY_STATES } from '@tamanu/constants';
import { centralDefaults, facilityDefaults } from '@tamanu/settings';

import { BlobReclaimer } from '../app/blobReclamation';
import { registerBlobReferenceSource } from '../app/blobReferences';
import { BlobOrphanCollectionTask } from '../app/tasks/BlobOrphanCollectionTask';
import { createTestContext } from './utilities';

const DAY_MS = 24 * 60 * 60 * 1000;
const SAFETY_WINDOW_MS = 7 * DAY_MS;

// spec: RECL
// Central orphan collection against a real database, since what the pass does
// is entirely a matter of what the liveness query can see: references that are
// soft-deleted, references that exist only as a changelog entry, and the
// integrity and quarantine states that retain content whatever references it.
describe('central orphan collection', () => {
  let ctx;
  let models;
  let sequelize;
  let reclaimer;
  let limits;
  let unregister;

  const uniqueContent = () => Buffer.from(`reclamation content ${randomUUID()}`);

  // Blobs are admitted well outside the safety window unless a case is about
  // the window itself; a blob admitted at test time is inside every window.
  const admit = async (content, { admittedDaysAgo = 30 } = {}) => {
    const { hash } = await ctx.blobStore.put(Readable.from([content]));
    await sequelize.query(
      `UPDATE blobs SET created_at = now() - make_interval(days => :days) WHERE hash = :hash`,
      { replacements: { days: admittedDaysAgo, hash } },
    );
    return hash;
  };

  // A reference standing in for a consumer record. A scratch table rather than
  // a real one so the reference-row cases cannot pass on the strength of the
  // changelog entry a real insert would leave behind.
  const reference = async (hash, { deletedAt = null } = {}) => {
    await sequelize.query(
      `INSERT INTO test_reclamation_refs (id, blob_hash, deleted_at)
       VALUES (:id, :hash, :deletedAt)`,
      { replacements: { id: randomUUID(), hash, deletedAt } },
    );
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    sequelize = ctx.store.sequelize;
    await sequelize.query(
      `CREATE TABLE test_reclamation_refs (
         id TEXT PRIMARY KEY,
         blob_hash TEXT NOT NULL,
         deleted_at TIMESTAMP WITH TIME ZONE
       )`,
    );
    unregister = registerBlobReferenceSource({
      recordType: 'test_reclamation_refs',
      hashColumn: 'blob_hash',
    });
    // As the server registers it at startup, so the asset cases exercise the
    // same source list production does.
    const unregisterAssets = registerBlobReferenceSource({
      recordType: 'assets',
      hashColumn: 'hash',
    });
    const dropScratchSource = unregister;
    unregister = () => {
      dropScratchSource();
      unregisterAssets();
    };

    reclaimer = new BlobReclaimer({
      sequelize,
      blobStore: ctx.blobStore,
      getLimits: async () => limits,
      log: { info: () => {}, warn: () => {} },
    });
  });

  afterAll(async () => {
    unregister();
    await sequelize.query('DROP TABLE IF EXISTS test_reclamation_refs');
    await ctx.close();
  });

  beforeEach(async () => {
    limits = { maxBlobs: 100, maxBytes: 1024 ** 3, safetyWindowMs: SAFETY_WINDOW_MS };
    await sequelize.query('DELETE FROM test_reclamation_refs');
    await models.BlobQuarantine.destroy({ where: {}, force: true });
    await models.Asset.destroy({ where: {}, force: true });
    await models.Blob.destroy({ where: {}, force: true });
  });

  it('collects an unreferenced blob admitted before the safety window', async () => {
    const hash = await admit(uniqueContent());

    const result = await reclaimer.run();

    expect(result).toMatchObject({ found: 1, collected: 1 });
    expect(await ctx.blobStore.has(hash)).toBe(false);
    expect(await models.Blob.findOne({ where: { hash } })).toBeNull();
  });

  it('retains an unreferenced blob admitted inside the safety window', async () => {
    const hash = await admit(uniqueContent(), { admittedDaysAgo: 1 });

    const result = await reclaimer.run();

    expect(result).toMatchObject({ found: 0, collected: 0 });
    expect(await ctx.blobStore.has(hash)).toBe(true);
  });

  it('retains a blob a live record references', async () => {
    const hash = await admit(uniqueContent());
    await reference(hash);

    expect(await reclaimer.run()).toMatchObject({ collected: 0 });
    expect(await ctx.blobStore.has(hash)).toBe(true);
  });

  // Clinical records are soft-deleted, so a deleted record still stands and
  // still names its content.
  it('retains a blob only a soft-deleted record references', async () => {
    const hash = await admit(uniqueContent());
    await reference(hash, { deletedAt: new Date() });

    expect(await reclaimer.run()).toMatchObject({ collected: 0 });
    expect(await ctx.blobStore.has(hash)).toBe(true);
  });

  // The case orphan collection is most likely to get wrong: nothing points at
  // the superseded content any more except the changelog entry that recorded
  // the asset as it stood.
  it('retains content superseded by a later upload on the same asset', async () => {
    const originalHash = await admit(uniqueContent());
    const replacementHash = await admit(uniqueContent());

    const asset = await models.Asset.create({
      name: `letterhead-${randomUUID()}`,
      type: 'image/png',
      hash: originalHash,
    });
    await asset.update({ hash: replacementHash });

    // The entry shape the liveness check reads: a row snapshot carrying the
    // hash under `hash`, one entry per version of the row.
    const [entries] = await sequelize.query(
      `SELECT record_data->>'hash' AS hash FROM logs.changes
       WHERE table_schema = 'public' AND table_name = 'assets' AND record_id = :id
       ORDER BY logged_at`,
      { replacements: { id: asset.id } },
    );
    expect(entries.map(entry => entry.hash)).toEqual([originalHash, replacementHash]);

    const result = await reclaimer.run();

    expect(result).toMatchObject({ found: 0, collected: 0 });
    expect(await ctx.blobStore.has(originalHash)).toBe(true);
    expect(await ctx.blobStore.has(replacementHash)).toBe(true);
  });

  it('retains content recorded corrupt and content quarantined as malware', async () => {
    const corruptHash = await admit(uniqueContent());
    await ctx.blobStore.recordIntegrityState(corruptHash, BLOB_INTEGRITY_STATES.CORRUPT);
    const quarantinedHash = await admit(uniqueContent());
    await models.BlobQuarantine.create({ hash: quarantinedHash });

    const result = await reclaimer.run();

    expect(result).toMatchObject({ found: 0, collected: 0 });
    expect(await ctx.blobStore.has(corruptHash)).toBe(true);
    expect(await ctx.blobStore.has(quarantinedHash)).toBe(true);
  });

  it('collects no more than the pass limit, and carries on next pass', async () => {
    limits.maxBlobs = 2;
    const hashes = [
      await admit(uniqueContent()),
      await admit(uniqueContent()),
      await admit(uniqueContent()),
    ];

    const first = await reclaimer.run();
    expect(first).toMatchObject({ collected: 2, ratelimited: true });

    const second = await reclaimer.run();
    expect(second).toMatchObject({ collected: 1, ratelimited: false });

    for (const hash of hashes) {
      expect(await ctx.blobStore.has(hash)).toBe(false);
    }
  });

  it('stops once it has reclaimed its byte budget', async () => {
    const content = uniqueContent();
    limits.maxBytes = 1;
    await admit(content);
    await admit(uniqueContent());

    const result = await reclaimer.run();

    expect(result).toMatchObject({ found: 2, collected: 1, ratelimited: true });
    expect(result.bytesReclaimed).toBe(content.length);
    expect(await models.Blob.count()).toBe(1);
  });

  it('runs from its scheduled task, which takes its bounds from settings', async () => {
    const hash = await admit(uniqueContent());
    const task = new BlobOrphanCollectionTask({ ...ctx, blobReclaimer: reclaimer });

    await task.run();

    expect(await ctx.blobStore.has(hash)).toBe(false);
    const { safetyWindow, maxBlobsPerPass, maxGigabytesPerPass } =
      centralDefaults.schedules.blobOrphanCollection;
    expect(ms(safetyWindow)).toBe(SAFETY_WINDOW_MS);
    expect(maxBlobsPerPass).toBeGreaterThan(0);
    expect(maxGigabytesPerPass).toBeGreaterThan(0);
  });

  // spec: RECL
  // A facility holds blobs as a bounded cache and reclaims space by eviction;
  // orphan collection is central's alone, so a facility has no schedule for it.
  it('is not schedulable on a facility server', () => {
    expect(centralDefaults.schedules).toHaveProperty('blobOrphanCollection');
    expect(facilityDefaults.schedules).not.toHaveProperty('blobOrphanCollection');
  });
});
