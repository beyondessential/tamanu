import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';

import { BLOB_INTEGRITY_STATES } from '@tamanu/constants';
import { BLOB_FAULTS } from '@tamanu/database/blobStore';

import { CentralBlobHealer } from '../app/blobIntegrity';
import { registerBlobReferenceSource, findUndeliverableReferences } from '../app/blobReferences';
import { createTestContext } from './utilities';

const hashOf = content => `sha256:${createHash('sha256').update(content).digest('hex')}`;

// spec: SCRUB
// The central referential-integrity query behind the scrub's referential pass:
// which synchronised references point at bytes central does not hold, once they
// are past the delivery grace. Exercised against a real database and a scratch
// reference source, since the query's load-bearing parts — the grace-time
// filter and the missing-bytes join — cannot be covered by mocking it.
describe('findUndeliverableReferences', () => {
  let ctx;
  let sequelize;
  let unregister;

  // A reference standing in for a consumer record: a row in the scratch table
  // with an update time, plus the sync_lookup entry that marks it synchronised.
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
      // Shaped like the synced tables a real source must be: every one of them
      // carries deleted_at, which the query relies on.
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

  // A deleted record references nothing, so its content is not owed. Left in,
  // these accumulate forever and hold the limit ahead of live references.
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

  // Longest-undelivered first, so a backlog past the limit reports the same
  // worst cases every pass rather than an arbitrary slice of itself.
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
  // A referential fault names content with no registry row at all, so there is
  // nothing for the ordinary state stamp to update. Recording it as an absent
  // blob is what puts the fault where the state model and its monitoring can see
  // it, and it hands the blob to the machinery that already handles absence.
  describe('recording the fault', () => {
    const healAsMissing = async hash =>
      await new CentralBlobHealer({ blobStore: ctx.blobStore }).heal({
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
      // The row is what takes it out of the pass, freeing the limit for faults
      // not yet recorded.
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

      // The commit settles the state and the size the placeholder row lacked.
      expect(await ctx.blobStore.servableStat(hash)).toEqual({
        size: content.length,
        integrityState: BLOB_INTEGRITY_STATES.VERIFIED,
        scanVerdict: null,
      });
    });
  });
});
