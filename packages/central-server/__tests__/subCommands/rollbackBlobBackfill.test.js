import { randomUUID } from 'node:crypto';
import { QueryTypes } from 'sequelize';

import { BlobBackfill } from '@tamanu/database/blobStore';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

import { createTestContext } from '../utilities';
import { rollbackBlobBackfill } from '../../app/subCommands/rollbackBlobBackfill';

// The pause between batches is the whole of the command's pacing, so it is
// observed rather than waited out.
jest.mock('@tamanu/utils/sleepAsync', () => ({
  sleepAsync: jest.fn().mockResolvedValue(undefined),
}));

// spec: BKFL
// Reverses the backfill by re-inflating the database from the blob store, ahead
// of a version downgrade. It restores from the store rather than a backup, and
// paces itself so a live deployment is not starved while it runs.
describe('rollbackBlobBackfill', () => {
  let ctx;
  let models;
  let sequelize;
  let backfill;

  const insertAttachment = async content => {
    const id = randomUUID();
    await sequelize.query(
      `INSERT INTO attachments (id, type, size, data) VALUES ($id, 'image/png', $size, $data)`,
      { bind: { id, size: content.length, data: content } },
    );
    return id;
  };

  const insertAsset = async content => {
    const id = randomUUID();
    await sequelize.query(
      `INSERT INTO assets (id, name, type, data) VALUES ($id, $name, 'image/png', $data)`,
      { bind: { id, name: `asset-${id}`, data: content } },
    );
    return id;
  };

  const rowOf = async (table, id) =>
    await sequelize.query(`SELECT hash, data FROM ${table} WHERE id = $id`, {
      bind: { id },
      type: QueryTypes.SELECT,
      plain: true,
    });

  const changelogEntriesHoldingBytes = async () => {
    const row = await sequelize.query(
      `
        SELECT count(*) AS count FROM logs.changes
        WHERE table_schema = 'public'
          AND table_name IN ('attachments', 'assets')
          AND record_data->>'data' IS NOT NULL
      `,
      { type: QueryTypes.SELECT, plain: true },
    );
    return Number(row.count);
  };

  const backfillEverything = async () => {
    for (const tableName of ['attachments', 'assets']) {
      await backfill.moveReferenceRows(tableName, 100);
    }
    await backfill.rewriteChangelogEntries(100);
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    sequelize = ctx.store.sequelize;
    backfill = new BlobBackfill({ sequelize, blobStore: ctx.blobStore });
    // The command builds its own store from settings, having no server context.
    await models.Setting.set('blobStorage.root', ctx.blobStore.root);
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    sleepAsync.mockClear();
    await sequelize.query('DELETE FROM attachments');
    await sequelize.query('DELETE FROM assets');
    await sequelize.query(
      `DELETE FROM logs.changes WHERE table_name IN ('attachments', 'assets')`,
    );
    await models.Blob.destroy({ where: {}, force: true });
  });

  it('restores both reference tables and the changelog', async () => {
    const attachmentContent = Buffer.from('an attachment on its way back');
    const assetContent = Buffer.from('an asset on its way back');
    const attachmentId = await insertAttachment(attachmentContent);
    const assetId = await insertAsset(assetContent);
    await backfillEverything();
    expect(await changelogEntriesHoldingBytes()).toBe(0);

    await rollbackBlobBackfill({ delay: 0 });

    const attachment = await rowOf('attachments', attachmentId);
    expect(attachment.hash).toBeNull();
    expect(Buffer.from(attachment.data)).toEqual(attachmentContent);
    const asset = await rowOf('assets', assetId);
    expect(asset.hash).toBeNull();
    expect(Buffer.from(asset.data)).toEqual(assetContent);
    expect(await changelogEntriesHoldingBytes()).toBe(2);
  });

  it('restores fifty rows a batch when no batch size is given', async () => {
    const rollbackRows = jest.spyOn(BlobBackfill.prototype, 'rollbackReferenceRows');
    const rollbackChangelog = jest.spyOn(BlobBackfill.prototype, 'rollbackChangelogEntries');
    await insertAttachment(Buffer.from('one row is enough to size a batch'));
    await backfillEverything();

    await rollbackBlobBackfill({ delay: 0 });

    expect(rollbackRows).toHaveBeenCalled();
    expect(rollbackChangelog).toHaveBeenCalled();
    for (const call of [...rollbackRows.mock.calls, ...rollbackChangelog.mock.calls]) {
      expect(call.at(-1)).toBe(50);
    }
    rollbackRows.mockRestore();
    rollbackChangelog.mockRestore();
  });

  it('pauses for the configured delay between batches', async () => {
    for (let i = 0; i < 3; i++) await insertAttachment(Buffer.from(`document ${i}`));
    await backfillEverything();

    await rollbackBlobBackfill({ batchSize: 1, delay: 250 });

    expect(sleepAsync).toHaveBeenCalledWith(250);
    expect(sleepAsync.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it('runs without pausing when the delay is explicitly zero', async () => {
    for (let i = 0; i < 3; i++) await insertAttachment(Buffer.from(`unpaced document ${i}`));
    await backfillEverything();

    await rollbackBlobBackfill({ batchSize: 1, delay: 0 });

    expect(sleepAsync).not.toHaveBeenCalled();
    const pending = await sequelize.query(
      `SELECT count(*) AS count FROM attachments WHERE hash IS NOT NULL`,
      { type: QueryTypes.SELECT, plain: true },
    );
    expect(Number(pending.count)).toBe(0);
  });
});
