import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';

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
  const reference = async (hash, { updatedAt }) => {
    const recordId = `undeliverable-ref-${seq++}`;
    await sequelize.query(
      'INSERT INTO test_undeliverable_refs (id, blob_hash, updated_at) VALUES (:recordId, :hash, :updatedAt)',
      { replacements: { recordId, hash, updatedAt } },
    );
    await sequelize.query(
      `INSERT INTO sync_lookup
        (record_id, record_type, data, updated_at_sync_tick, patient_id, facility_id, is_lab_request, is_deleted)
       VALUES (:recordId, 'test_undeliverable_refs', '{}', 1, NULL, NULL, FALSE, FALSE)`,
      { replacements: { recordId } },
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
      `CREATE TABLE test_undeliverable_refs (
         id TEXT PRIMARY KEY,
         blob_hash TEXT NOT NULL,
         updated_at TIMESTAMP WITH TIME ZONE NOT NULL
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
});
