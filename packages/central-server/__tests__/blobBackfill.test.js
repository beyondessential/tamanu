import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { QueryTypes } from 'sequelize';

import { BlobBackfill } from '@tamanu/database/blobStore';
import { BlobStore } from '@tamanu/database/blobStore/BlobStore';
import { InsufficientStorageError } from '@tamanu/errors';

import { createTestContext } from './utilities';

const hashOf = content => `sha256:${createHash('sha256').update(content).digest('hex')}`;

const readAll = async stream => {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
};

describe('Blob backfill', () => {
  let ctx;
  let models;
  let sequelize;
  let root;
  let volumeFreeBytes;
  let reserveBytes;
  let blobStore;
  let backfill;

  const insertAttachment = async (content, { type = 'image/png' } = {}) => {
    const id = randomUUID();
    await sequelize.query(
      `INSERT INTO attachments (id, type, size, data) VALUES ($id, $type, $size, $data)`,
      { bind: { id, type, size: content.length, data: content } },
    );
    return id;
  };

  const insertAsset = async (content, { name = 'letterhead' } = {}) => {
    const id = randomUUID();
    await sequelize.query(
      `INSERT INTO assets (id, name, type, data) VALUES ($id, $name, $type, $data)`,
      { bind: { id, name, type: 'image/png', data: content } },
    );
    return id;
  };

  const rowOf = async (table, id) =>
    await sequelize.query(`SELECT id, hash, data FROM ${table} WHERE id = $id`, {
      bind: { id },
      type: QueryTypes.SELECT,
      plain: true,
    });

  const insertChangelogEntry = async (tableName, recordId, content) => {
    const id = randomUUID();
    const recordData = {
      id: recordId,
      type: 'image/png',
      // Postgres renders a bytea into JSON in its hex format.
      data: `\\x${content.toString('hex')}`,
    };
    await sequelize.query(
      `
        INSERT INTO logs.changes
          (id, table_oid, table_schema, table_name, logged_at, updated_by_user_id,
           record_id, record_created_at, record_updated_at, record_data, device_id, version)
        VALUES
          ($id, 0, 'public', $tableName, now(), '00000000-0000-0000-0000-000000000000',
           $recordId, now(), now(), $recordData, 'test', '2.62.0')
      `,
      { bind: { id, tableName, recordId, recordData: JSON.stringify(recordData) } },
    );
    return id;
  };

  const entryOf = async id =>
    await sequelize.query(`SELECT record_data FROM logs.changes WHERE id = $id`, {
      bind: { id },
      type: QueryTypes.SELECT,
      plain: true,
    });

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    sequelize = ctx.store.sequelize;
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'tamanu-backfill-'));
    volumeFreeBytes = 1024 ** 4;
    reserveBytes = 0;
    blobStore = new BlobStore({
      root,
      models,
      getFreeDiskReserveBytes: async () => reserveBytes,
      statfs: async () => ({ bavail: volumeFreeBytes, bsize: 1 }),
    });
    backfill = new BlobBackfill({ sequelize, blobStore });

    await sequelize.query('DELETE FROM attachments');
    await sequelize.query('DELETE FROM assets');
    await sequelize.query(
      `DELETE FROM logs.changes WHERE table_name IN ('attachments', 'assets')`,
    );
    await models.Blob.destroy({ where: {}, force: true });
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  describe('moving reference rows', () => {
    it('moves an attachment onto the store and swaps the row over to its hash', async () => {
      const content = Buffer.from('an attached document');
      const id = await insertAttachment(content);

      const moved = await backfill.moveReferenceRows('attachments', 10);

      expect(moved).toBe(1);
      const row = await rowOf('attachments', id);
      expect(row.hash).toBe(hashOf(content));
      expect(row.data).toBeNull();
      expect(await readAll(await blobStore.get(row.hash))).toEqual(content);
    });

    it('moves assets the same way', async () => {
      const content = Buffer.from('a letterhead logo');
      const id = await insertAsset(content);

      await backfill.moveReferenceRows('assets', 10);

      const row = await rowOf('assets', id);
      expect(row.hash).toBe(hashOf(content));
      expect(row.data).toBeNull();
    });

    it('stores one blob for rows that share content', async () => {
      const content = Buffer.from('the same bytes twice');
      const first = await insertAttachment(content);
      const second = await insertAttachment(content);

      await backfill.moveReferenceRows('attachments', 10);

      const firstRow = await rowOf('attachments', first);
      const secondRow = await rowOf('attachments', second);
      expect(firstRow.hash).toBe(secondRow.hash);
      expect(await models.Blob.count({ where: { hash: firstRow.hash } })).toBe(1);
    });

    it('handles zero-byte content', async () => {
      const id = await insertAttachment(Buffer.alloc(0));

      await backfill.moveReferenceRows('attachments', 10);

      const row = await rowOf('attachments', id);
      expect(row.hash).toBe(hashOf(Buffer.alloc(0)));
      expect(row.data).toBeNull();
    });

    it('moves multi-megabyte content intact', async () => {
      const content = Buffer.alloc(9 * 1024 * 1024);
      for (let i = 0; i < content.length; i++) content[i] = i % 251;
      const id = await insertAttachment(content);

      await backfill.moveReferenceRows('attachments', 10);

      const row = await rowOf('attachments', id);
      expect(row.hash).toBe(hashOf(content));
      expect(await readAll(await blobStore.get(row.hash))).toEqual(content);
    });

    it('stops at the batch size and picks the rest up on the next run', async () => {
      for (let i = 0; i < 5; i++) await insertAttachment(Buffer.from(`document ${i}`));

      expect(await backfill.moveReferenceRows('attachments', 2)).toBe(2);
      expect(await backfill.moveReferenceRows('attachments', 2)).toBe(2);
      expect(await backfill.moveReferenceRows('attachments', 2)).toBe(1);
      expect(await backfill.moveReferenceRows('attachments', 2)).toBe(0);
    });

    it('leaves an already-moved row alone', async () => {
      await insertAttachment(Buffer.from('once only'));
      await backfill.moveReferenceRows('attachments', 10);

      expect(await backfill.moveReferenceRows('attachments', 10)).toBe(0);
    });

    it('skips a row deleted between the batch scan and its read', async () => {
      const present = Buffer.from('still here');
      const vanishing = Buffer.from('about to be deleted');
      const presentId = await insertAttachment(present);
      const vanishingId = await insertAttachment(vanishing);

      // Delete the row just before its per-row data read, the way an attachment
      // hard-deleted after push would vanish mid-batch.
      const realQuery = sequelize.query.bind(sequelize);
      let deleted = false;
      jest.spyOn(sequelize, 'query').mockImplementation(async (sql, opts) => {
        if (!deleted && typeof sql === 'string' && sql.startsWith('SELECT data FROM attachments')) {
          deleted = true;
          await realQuery(`DELETE FROM attachments WHERE id = $id`, { bind: { id: vanishingId } });
        }
        return realQuery(sql, opts);
      });

      let moved;
      try {
        moved = await backfill.moveReferenceRows('attachments', 10);
      } finally {
        sequelize.query.mockRestore();
      }

      // The run completes rather than throwing, and the surviving row is moved.
      expect(moved).toBe(1);
      expect((await rowOf('attachments', presentId)).hash).toBe(hashOf(present));
    });

    it('resumes after an interrupted run without duplicating content', async () => {
      const content = Buffer.from('interrupted midway');
      const id = await insertAttachment(content);
      // The bytes reach the store before the row changes; simulate dying in between.
      await blobStore.put(
        (await import('node:stream')).Readable.from([content]),
      );

      const moved = await backfill.moveReferenceRows('attachments', 10);

      expect(moved).toBe(1);
      expect(await models.Blob.count({ where: { hash: hashOf(content) } })).toBe(1);
      expect((await rowOf('attachments', id)).hash).toBe(hashOf(content));
    });

    it('writes no changelog entry for the move itself', async () => {
      const id = await insertAttachment(Buffer.from('quiet move'));
      const countEntries = async () => {
        const row = await sequelize.query(
          `SELECT count(*) AS count FROM logs.changes WHERE table_name = 'attachments' AND record_id = $id`,
          { bind: { id }, type: QueryTypes.SELECT, plain: true },
        );
        return Number(row.count);
      };
      // The insert itself is logged, bytes and all; that entry is what the
      // changelog rewrite deals with. The move must not add a second one.
      const beforeMove = await countEntries();
      expect(beforeMove).toBe(1);

      await backfill.moveReferenceRows('attachments', 10);

      expect(await countEntries()).toBe(beforeMove);
    });

    it('refuses to cross the free-disk reserve and leaves the row untouched', async () => {
      const id = await insertAttachment(Buffer.from('no room for this'));
      volumeFreeBytes = 100;
      reserveBytes = 1000;

      await expect(backfill.moveReferenceRows('attachments', 10)).rejects.toThrow(
        InsufficientStorageError,
      );

      const row = await rowOf('attachments', id);
      expect(row.hash).toBeNull();
      expect(row.data).not.toBeNull();
    });
  });

  describe('seeding without owning the rows', () => {
    it('admits content but leaves the rows as they are', async () => {
      const content = Buffer.from('an asset pulled from central');
      const id = await insertAsset(content);

      const seeded = await backfill.seedReferenceRows('assets', 10);

      expect(seeded).toBe(1);
      expect(await blobStore.has(hashOf(content))).toBe(true);
      const row = await rowOf('assets', id);
      expect(row.hash).toBeNull();
      expect(row.data).not.toBeNull();
    });

    it('walks the pending rows by offset so a run terminates', async () => {
      for (let i = 0; i < 3; i++) await insertAsset(Buffer.from(`asset ${i}`), { name: `a${i}` });

      expect(await backfill.seedReferenceRows('assets', 2, 0)).toBe(2);
      expect(await backfill.seedReferenceRows('assets', 2, 2)).toBe(1);
      expect(await backfill.seedReferenceRows('assets', 2, 3)).toBe(0);
    });

    it('leaves the facility holding content that matches the hash central will send', async () => {
      const content = Buffer.from('convergent bytes');
      await insertAsset(content);

      await backfill.seedReferenceRows('assets', 10);

      // Central computes the same hash from the same bytes, so the updated row
      // arriving later finds its blob already present.
      expect(await blobStore.has(hashOf(content))).toBe(true);
    });
  });

  describe('changelog entries', () => {
    it('replaces an entry’s bytes with the hash and keeps the content', async () => {
      const content = Buffer.from('a historical snapshot');
      const entryId = await insertChangelogEntry('attachments', randomUUID(), content);

      const rewritten = await backfill.rewriteChangelogEntries(10);

      expect(rewritten).toBe(1);
      const entry = await entryOf(entryId);
      expect(entry.record_data.hash).toBe(hashOf(content));
      expect(entry.record_data.data).toBeNull();
      expect(await readAll(await blobStore.get(hashOf(content)))).toEqual(content);
    });

    it('preserves content that survives only in the changelog', async () => {
      const superseded = Buffer.from('the logo we replaced');
      const current = Buffer.from('the logo we use now');
      const assetId = await insertAsset(current);
      await insertChangelogEntry('assets', assetId, superseded);

      await backfill.rewriteChangelogEntries(10);
      await backfill.moveReferenceRows('assets', 10);

      expect(await readAll(await blobStore.get(hashOf(superseded)))).toEqual(superseded);
      expect(await readAll(await blobStore.get(hashOf(current)))).toEqual(current);
    });

    it('is idempotent across runs', async () => {
      await insertChangelogEntry('attachments', randomUUID(), Buffer.from('rewrite me once'));

      expect(await backfill.rewriteChangelogEntries(10)).toBe(1);
      expect(await backfill.rewriteChangelogEntries(10)).toBe(0);
    });

    it('leaves entries for other tables alone', async () => {
      const entryId = await insertChangelogEntry('patients', randomUUID(), Buffer.from('not a blob'));

      await backfill.rewriteChangelogEntries(10);

      const entry = await entryOf(entryId);
      expect(entry.record_data.data).not.toBeNull();
    });
  });

  describe('progress and completion', () => {
    it('reports what is left to move', async () => {
      await insertAttachment(Buffer.from('one'));
      await insertAsset(Buffer.from('two'));
      await insertChangelogEntry('attachments', randomUUID(), Buffer.from('three'));

      const before = await backfill.countRemaining();
      expect(before.rows.attachments).toBe(1);
      expect(before.rows.assets).toBe(1);
      // The two inserts above are themselves logged with their bytes inline,
      // which is the duplication this backfill exists to undo, so they count
      // alongside the entry written directly.
      expect(before.changelogEntries).toBe(3);

      await backfill.moveReferenceRows('attachments', 10);
      await backfill.moveReferenceRows('assets', 10);
      await backfill.rewriteChangelogEntries(10);

      const after = await backfill.countRemaining();
      expect(after.rows.attachments).toBe(0);
      expect(after.rows.assets).toBe(0);
      expect(after.changelogEntries).toBe(0);
    });

    it('confirms every referenced hash is backed by content this server holds', async () => {
      await insertAttachment(Buffer.from('backed by the store'));
      await insertChangelogEntry('assets', randomUUID(), Buffer.from('also backed'));

      await backfill.moveReferenceRows('attachments', 10);
      await backfill.rewriteChangelogEntries(10);

      expect(await backfill.findUnbackedHashes()).toEqual([]);
    });

    it('names a hash whose content the server does not hold', async () => {
      const content = Buffer.from('gone from the store');
      await insertAttachment(content);
      await backfill.moveReferenceRows('attachments', 10);
      await blobStore.delete(hashOf(content));

      expect(await backfill.findUnbackedHashes()).toEqual([hashOf(content)]);
    });
  });

  describe('rollback', () => {
    it('puts a moved row’s bytes back and drops its hash', async () => {
      const content = Buffer.from('back into the database');
      const id = await insertAttachment(content);
      await backfill.moveReferenceRows('attachments', 10);

      const restored = await backfill.rollbackReferenceRows('attachments', 10);

      expect(restored).toBe(1);
      const row = await rowOf('attachments', id);
      expect(row.hash).toBeNull();
      expect(row.data).toEqual(content);
    });

    it('restores multi-megabyte content intact', async () => {
      const content = Buffer.alloc(9 * 1024 * 1024);
      for (let i = 0; i < content.length; i++) content[i] = (i * 7) % 251;
      const id = await insertAttachment(content);
      await backfill.moveReferenceRows('attachments', 10);

      await backfill.rollbackReferenceRows('attachments', 10);

      expect((await rowOf('attachments', id)).data).toEqual(content);
    });

    it('restores a row left carrying both a hash and stale bytes', async () => {
      // The shape a crashed earlier rollback attempt would leave behind. The
      // hash is what marks the row as not yet rolled back, so this must restore
      // rather than skip, whatever the data column happens to hold.
      const content = Buffer.from('the authoritative bytes');
      const id = await insertAttachment(content);
      await backfill.moveReferenceRows('attachments', 10);
      await sequelize.query(`UPDATE attachments SET data = '\\x00'::bytea WHERE id = $id`, {
        bind: { id },
      });

      const restored = await backfill.rollbackReferenceRows('attachments', 10);

      expect(restored).toBe(1);
      const row = await rowOf('attachments', id);
      expect(row.hash).toBeNull();
      expect(row.data).toEqual(content);
    });

    it('restores a changelog entry’s byte snapshot', async () => {
      const content = Buffer.from('a snapshot to restore');
      const entryId = await insertChangelogEntry('assets', randomUUID(), content);
      await backfill.rewriteChangelogEntries(10);

      const restored = await backfill.rollbackChangelogEntries(10);

      expect(restored).toBe(1);
      const entry = await entryOf(entryId);
      expect(entry.record_data.data).toBe(`\\x${content.toString('hex')}`);
      expect(entry.record_data.hash).toBeNull();
    });

    it('reverses a partially completed backfill', async () => {
      const moved = Buffer.from('this one moved');
      const untouched = Buffer.from('this one did not');
      const movedId = await insertAttachment(moved);
      const untouchedId = await insertAttachment(untouched);
      // Only the first row is moved, leaving the backfill half done.
      await backfill.moveReferenceRows('attachments', 1);

      await backfill.rollbackReferenceRows('attachments', 10);

      expect((await rowOf('attachments', movedId)).data).toEqual(moved);
      expect((await rowOf('attachments', untouchedId)).data).toEqual(untouched);
      const rows = await sequelize.query(
        `SELECT count(*) AS count FROM attachments WHERE hash IS NOT NULL`,
        { type: QueryTypes.SELECT, plain: true },
      );
      expect(Number(rows.count)).toBe(0);
    });

    it('round-trips content unchanged through backfill and rollback', async () => {
      const content = Buffer.from([0x00, 0xff, 0x10, 0x5c, 0x78, 0x00, 0x41]);
      const id = await insertAttachment(content);

      await backfill.moveReferenceRows('attachments', 10);
      await backfill.rollbackReferenceRows('attachments', 10);

      expect((await rowOf('attachments', id)).data).toEqual(content);
    });
  });
});
