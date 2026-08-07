import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { QueryTypes } from 'sequelize';

import { SETTINGS_SCOPES } from '@tamanu/constants';
import { BlobBackfillTask } from '@tamanu/shared/tasks';

import { createTestContext } from './utilities';

const hashOf = content => `sha256:${createHash('sha256').update(content).digest('hex')}`;

describe('BlobBackfillTask', () => {
  let ctx;
  let models;
  let sequelize;
  let root;

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

  const makeTask = overrides =>
    new BlobBackfillTask(ctx, { schedule: '* * * * *', enabled: true, ...overrides });

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    sequelize = ctx.store.sequelize;
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'tamanu-backfill-task-'));
    await models.Setting.set('blobStorage.root', root, SETTINGS_SCOPES.CENTRAL);

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

  it('builds its store from settings, so the root is where the setting points', async () => {
    const content = Buffer.from('into the configured root');
    await insertAttachment(content);

    await makeTask({ batchSize: 10, batchSleepAsyncDurationInMilliseconds: 0 }).run();

    const { digest } = { digest: hashOf(content).split(':')[1] };
    const stored = path.join(root, 'sha256', digest.slice(0, 2), digest.slice(2, 4), digest.slice(4));
    await expect(fs.access(stored)).resolves.toBeUndefined();
  });

  it('drains every table and the changelog in one run', async () => {
    const attachmentId = await insertAttachment(Buffer.from('an attachment'));
    const assetId = await insertAsset(Buffer.from('an asset'));

    await makeTask({ batchSize: 10, batchSleepAsyncDurationInMilliseconds: 0 }).run();

    expect((await rowOf('attachments', attachmentId)).data).toBeNull();
    expect((await rowOf('assets', assetId)).data).toBeNull();
    const remaining = await sequelize.query(
      `
        SELECT count(*) AS count FROM logs.changes
        WHERE table_name IN ('attachments', 'assets') AND record_data->>'data' IS NOT NULL
      `,
      { type: QueryTypes.SELECT, plain: true },
    );
    expect(Number(remaining.count)).toBe(0);
  });

  it('works through more rows than one batch holds', async () => {
    for (let i = 0; i < 7; i++) await insertAttachment(Buffer.from(`document ${i}`));

    await makeTask({ batchSize: 2, batchSleepAsyncDurationInMilliseconds: 0 }).run();

    const pending = await sequelize.query(
      `SELECT count(*) AS count FROM attachments WHERE data IS NOT NULL`,
      { type: QueryTypes.SELECT, plain: true },
    );
    expect(Number(pending.count)).toBe(0);
  });

  it('reports the queue as empty once everything has moved', async () => {
    await insertAttachment(Buffer.from('the last one'));
    const task = makeTask({ batchSize: 10, batchSleepAsyncDurationInMilliseconds: 0 });

    expect(await task.countQueue()).toBeGreaterThan(0);
    await task.run();

    expect(await task.countQueue()).toBe(0);
  });

  it('does nothing on a deployment with no legacy content', async () => {
    const task = makeTask({ batchSize: 10, batchSleepAsyncDurationInMilliseconds: 0 });

    expect(await task.countQueue()).toBe(0);
    await expect(task.run()).resolves.toBeUndefined();
  });

  it('picks up where it left off when a run is cut short', async () => {
    for (let i = 0; i < 4; i++) await insertAttachment(Buffer.from(`document ${i}`));
    const task = makeTask({ batchSize: 10, batchSleepAsyncDurationInMilliseconds: 0 });
    const backfill = await task.getBackfill();
    // One batch's worth, as though the process died straight afterwards.
    await backfill.moveReferenceRows('attachments', 2);

    await task.run();

    const pending = await sequelize.query(
      `SELECT count(*) AS count FROM attachments WHERE data IS NOT NULL`,
      { type: QueryTypes.SELECT, plain: true },
    );
    expect(Number(pending.count)).toBe(0);
  });

  it('pauses instead of failing when the free-disk reserve is reached', async () => {
    const id = await insertAttachment(Buffer.from('no room for this'));
    // A reserve no real volume can satisfy, so admission refuses. The store
    // reads the reserve per check, so this applies without rebuilding it.
    await models.Setting.set('blobStorage.freeDiskReserveGB', 1e9, SETTINGS_SCOPES.GLOBAL);

    try {
      const task = makeTask({ batchSize: 10, batchSleepAsyncDurationInMilliseconds: 0 });
      await expect(task.run()).resolves.toBeUndefined();

      const row = await rowOf('attachments', id);
      expect(row.hash).toBeNull();
      expect(row.data).not.toBeNull();
    } finally {
      await models.Setting.set('blobStorage.freeDiskReserveGB', 10, SETTINGS_SCOPES.GLOBAL);
    }
  });
});
