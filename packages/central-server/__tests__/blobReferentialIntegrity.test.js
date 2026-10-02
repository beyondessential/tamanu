import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';

import { BLOB_INTEGRITY_STATES } from '@tamanu/constants';
import { BLOB_FAULTS } from '@tamanu/database/blobStore';

import { CentralBlobHealer } from '../app/blobIntegrity';
import { registerBlobReferenceSource, findUndeliverableReferences } from '../app/blobReferences';
import { createTestContext } from './utilities';

const hashOf = content => `sha256:${createHash('sha256').update(content).digest('hex')}`;

// spec: SCRUB
// Against a real database: the grace-time filter and missing-bytes join can't be covered by
// mocking.
describe('findUndeliverableReferences', () => {
  let ctx;
  let sequelize;
  let unregister;

  let seq = 0;
  const reference = async (hash, { updatedAt, deletedAt = null, lookupDeleted = false }) => {
    const recordId = `undeliverable-ref-${seq++}`;
    await sequelize.query(
      `INSERT INTO test_undeliverable_refs (id, blob_hash, updated_at, deleted_at)
       VALUES (:recordId, :hash, :updatedAt, :deletedAt)`,
      { replacements: { recordId, hash, updatedAt, deletedAt } },
    );
    await sequelize.query(
      `INSERT INTO sync_lookup
        (record_id, record_type, data, updated_at_sync_tick, patient_id, facility_id, is_lab_request, is_deleted)
       VALUES (:recordId, 'test_undeliverable_refs', '{}', 1, NULL, NULL, FALSE, :lookupDeleted)`,
      { replacements: { recordId, lookupDeleted } },
    );
    return recordId;
  };

  const holdBytes = async content => {
    await ctx.blobStore.put(Readable.from(content));
  };

  const DELIVERED_BEFORE = new Date('2026-01-02T00:00:00Z');
  const BEFORE_GRACE = new Date('2026-01-01T00:00:00Z'); // old enough to be undelivered
  const WITHIN_GRACE = new Date('2026-01-03T00:00:00Z'); // still content-pending

  beforeAll(async () => {
    ctx = await createTestContext();
    sequelize = ctx.store.sequelize;
    await sequelize.query(
      // Every synced table carries deleted_at, which the query relies on.
      `CREATE TABLE test_undeliverable_refs (
         id TEXT PRIMARY KEY,
         blob_hash TEXT NOT NULL,
         updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
         deleted_at TIMESTAMP WITH TIME ZONE
       )`,
    );
    unregister = registerBlobReferenceSource({
      recordType: 'test_undeliverable_refs',
      hashColumn: 'blob_hash',
    });
  });

  afterAll(async () => {
    unregister();
    await sequelize.query('DROP TABLE IF EXISTS test_undeliverable_refs');
    await ctx.close();
  });

  beforeEach(async () => {
    await sequelize.query(
      `DELETE FROM sync_lookup WHERE record_type = 'test_undeliverable_refs'`,
    );
    await sequelize.query('DELETE FROM test_undeliverable_refs');
    await ctx.store.models.Blob.destroy({ where: {}, force: true });
  });

  it('reports a past-grace reference whose bytes central does not hold', async () => {
    const hash = hashOf('undelivered content');
    await reference(hash, { updatedAt: BEFORE_GRACE });

    const result = await findUndeliverableReferences(sequelize, {
      limit: 100,
      deliveredBefore: DELIVERED_BEFORE,
    });

    expect(result).toEqual([hash]);
  });

  it('leaves a reference still within the delivery grace as content-pending', async () => {
    const hash = hashOf('freshly referenced content');
    await reference(hash, { updatedAt: WITHIN_GRACE });

    const result = await findUndeliverableReferences(sequelize, {
      limit: 100,
      deliveredBefore: DELIVERED_BEFORE,
    });

    expect(result).toEqual([]);
  });

  it('does not report a reference whose bytes central holds', async () => {
    const content = Buffer.from('content central holds');
    await reference(hashOf(content), { updatedAt: BEFORE_GRACE });
    await holdBytes(content);

    const result = await findUndeliverableReferences(sequelize, {
      limit: 100,
      deliveredBefore: DELIVERED_BEFORE,
    });

    expect(result).toEqual([]);
  });

  it('reports a hash once even when several references point at it', async () => {
    const hash = hashOf('content referenced twice');
    await reference(hash, { updatedAt: BEFORE_GRACE });
    await reference(hash, { updatedAt: BEFORE_GRACE });

    const result = await findUndeliverableReferences(sequelize, {
      limit: 100,
      deliveredBefore: DELIVERED_BEFORE,
    });

    expect(result).toEqual([hash]);
  });

  it('bounds the batch to the requested limit', async () => {
    for (let i = 0; i < 3; i++) {
      await reference(hashOf(`undelivered ${i}`), { updatedAt: BEFORE_GRACE });
    }

    const result = await findUndeliverableReferences(sequelize, {
      limit: 2,
      deliveredBefore: DELIVERED_BEFORE,
    });

    expect(result).toHaveLength(2);
  });

  // Left in, deleted references accumulate forever and hold the limit ahead of live ones.
  it('does not report a reference whose record is deleted', async () => {
    await reference(hashOf('deleted record content'), {
      updatedAt: BEFORE_GRACE,
      deletedAt: BEFORE_GRACE,
    });
    await reference(hashOf('lookup-deleted record content'), {
      updatedAt: BEFORE_GRACE,
      lookupDeleted: true,
    });

    const result = await findUndeliverableReferences(sequelize, {
      limit: 100,
      deliveredBefore: DELIVERED_BEFORE,
    });

    expect(result).toEqual([]);
  });

  it('reports the longest-undelivered references first, and repeatably', async () => {
    const oldest = hashOf('oldest undelivered');
    const middle = hashOf('middle undelivered');
    const newest = hashOf('newest undelivered');
    await reference(middle, { updatedAt: new Date('2026-01-01T12:00:00Z') });
    await reference(newest, { updatedAt: new Date('2026-01-01T18:00:00Z') });
    await reference(oldest, { updatedAt: new Date('2026-01-01T06:00:00Z') });

    const query = async () =>
      await findUndeliverableReferences(sequelize, {
        limit: 2,
        deliveredBefore: DELIVERED_BEFORE,
      });

    expect(await query()).toEqual([oldest, middle]);
    expect(await query()).toEqual([oldest, middle]);
  });

  // spec: SCRUB
  describe('recording the fault', () => {
    const healAsMissing = async hash =>
      await new CentralBlobHealer({ blobStore: ctx.blobStore, models: ctx.store.models }).heal({
        hash,
        fault: BLOB_FAULTS.MISSING,
        blob: null,
      });

    const undeliverable = async () =>
      await findUndeliverableReferences(sequelize, {
        limit: 100,
        deliveredBefore: DELIVERED_BEFORE,
      });

    it('registers an undeliverable reference absent, and stops re-finding it every pass', async () => {
      const hash = hashOf('undelivered and unrecorded');
      await reference(hash, { updatedAt: BEFORE_GRACE });
      expect(await undeliverable()).toEqual([hash]);

      await healAsMissing(hash);

      const recorded = await ctx.store.models.Blob.findOne({ where: { hash } });
      expect(recorded.integrityState).toBe(BLOB_INTEGRITY_STATES.ABSENT);
      expect(await undeliverable()).toEqual([]);
    });

    it('leaves the recorded blob unservable until its content actually arrives', async () => {
      const content = Buffer.from('content that arrives later');
      const hash = hashOf(content);
      await reference(hash, { updatedAt: BEFORE_GRACE });
      await healAsMissing(hash);

      expect(await ctx.blobStore.servableStat(hash)).toBeNull();

      await ctx.blobStore.stage(hash, Readable.from(content), { offset: 0 });
      await ctx.blobStore.commitStaged(hash);

      expect(await ctx.blobStore.servableStat(hash)).toEqual({
        size: content.length,
        integrityState: BLOB_INTEGRITY_STATES.VERIFIED,
        scanVerdict: null,
      });
    });
  });
});
