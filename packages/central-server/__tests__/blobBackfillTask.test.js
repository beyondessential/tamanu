import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { QueryTypes } from 'sequelize';

import { BlobStore } from '@tamanu/database/blobStore';
import { log } from '@tamanu/shared/services/logging';
import { BlobBackfillTask } from '@tamanu/shared/tasks';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

import { createTestContext } from './utilities';

// The pause between batches is observed rather than waited out.
jest.mock('@tamanu/utils/sleepAsync', () => ({
  sleepAsync: jest.fn().mockResolvedValue(undefined),
}));

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

  const makeTask = (overrides, contextOverrides) =>
    new BlobBackfillTask(
      { ...ctx, settings: ctx.settings, ...contextOverrides },
      { schedule: '* * * * *', enabled: true, ...overrides },
    );

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    sequelize = ctx.store.sequelize;
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    root = ctx.blobStore.root;
    sleepAsync.mockClear();

    await sequelize.query('DELETE FROM attachments');
    await sequelize.query('DELETE FROM assets');
    await sequelize.query(
      `DELETE FROM logs.changes WHERE table_name IN ('attachments', 'assets')`,
    );
    await models.Blob.destroy({ where: {}, force: true });
  });

  it('admits into the server\u2019s own store rather than one of its own making', async () => {
    const content = Buffer.from('into the server store');
    await insertAttachment(content);

    await makeTask({ batchSize: 10, batchSleepAsyncDurationInMilliseconds: 0 }).run();

    const digest = hashOf(content).split(':')[1];
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

  it('on a facility, seeds asset content and leaves attachments to the outbox', async () => {
    const assetContent = Buffer.from('a synced letterhead');
    const attachmentContent = Buffer.from('a local attachment mid-push');
    const assetId = await insertAsset(assetContent);
    const attachmentId = await insertAttachment(attachmentContent);

    const previous = global.serverInfo;
    global.serverInfo = { serverType: 'facility' };
    try {
      await makeTask({ batchSize: 10, batchSleepAsyncDurationInMilliseconds: 0 }).run();
    } finally {
      // eslint-disable-next-line require-atomic-updates -- single-threaded save/restore
      global.serverInfo = previous;
    }

    // Asset bytes are seeded into the store so the hash-carrying row central
    // sends later resolves locally; the row itself is left for that sync.
    expect(await ctx.blobStore.has(hashOf(assetContent))).toBe(true);
    expect((await rowOf('assets', assetId)).data).not.toBeNull();
    // Attachments are not the facility's to move, and are not seeded either:
    // they push inline and become outbox blobs elsewhere (G2/J2).
    expect(await ctx.blobStore.has(hashOf(attachmentContent))).toBe(false);
    expect((await rowOf('attachments', attachmentId)).data).not.toBeNull();
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
    const backfill = task.getBackfill();
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
    // A store whose volume cannot satisfy its reserve, so admission refuses.
    const starvedStore = new BlobStore({
      root: await fs.mkdtemp(path.join(os.tmpdir(), 'tamanu-backfill-starved-')),
      models,
      getFreeDiskReserveBytes: async () => 1024 ** 4,
      statfs: async () => ({ bavail: 1, bsize: 1 }),
    });

    const task = makeTask(
      { batchSize: 10, batchSleepAsyncDurationInMilliseconds: 0 },
      { blobStore: starvedStore },
    );
    await expect(task.run()).resolves.toBeUndefined();

    const row = await rowOf('attachments', id);
    expect(row.hash).toBeNull();
    expect(row.data).not.toBeNull();
    await fs.rm(starvedStore.root, { recursive: true, force: true });
  });

  // spec: BKFL
  // The pause between batches is what keeps a long run off the back of a live
  // deployment, so it has to be taken and be the configured length.
  describe('batch pacing', () => {
    it('pauses for the configured length between batches', async () => {
      for (let i = 0; i < 3; i++) await insertAttachment(Buffer.from(`document ${i}`));

      await makeTask({ batchSize: 1, batchSleepAsyncDurationInMilliseconds: 250 }).run();

      expect(sleepAsync).toHaveBeenCalledWith(250);
      expect(sleepAsync.mock.calls.length).toBeGreaterThanOrEqual(3);
    });

    it('does not pause when the configured length is zero', async () => {
      for (let i = 0; i < 3; i++) await insertAttachment(Buffer.from(`document ${i}`));

      await makeTask({ batchSize: 1, batchSleepAsyncDurationInMilliseconds: 0 }).run();

      expect(sleepAsync).not.toHaveBeenCalled();
    });
  });

  // spec: BKFL
  // The report a run ends on is the only operator-visible completion signal, and
  // no bytes left in the database is only half of done.
  describe('completion reporting', () => {
    let info;
    let warn;

    const messagesOf = spy => spy.mock.calls.map(([message]) => message);

    beforeEach(() => {
      info = jest.spyOn(log, 'info');
      warn = jest.spyOn(log, 'warn');
    });

    afterEach(() => {
      info.mockRestore();
      warn.mockRestore();
    });

    it('reports completion once nothing holds bytes and every hash resolves', async () => {
      await insertAttachment(Buffer.from('the last of the legacy content'));

      await makeTask({ batchSize: 10, batchSleepAsyncDurationInMilliseconds: 0 }).run();

      expect(messagesOf(info)).toContain(
        'BlobBackfillTask: complete, no in-database blob content remains',
      );
    });

    it('reports content still to move when a pass leaves rows behind', async () => {
      await insertAsset(Buffer.from('a letterhead a facility only seeds'));

      const previous = global.serverInfo;
      global.serverInfo = { serverType: 'facility' };
      try {
        await makeTask({ batchSize: 10, batchSleepAsyncDurationInMilliseconds: 0 }).run();
      } finally {
        // eslint-disable-next-line require-atomic-updates -- single-threaded save/restore
        global.serverInfo = previous;
      }

      expect(messagesOf(info)).toContain('BlobBackfillTask: content still to move');
      expect(messagesOf(info)).not.toContain(
        'BlobBackfillTask: complete, no in-database blob content remains',
      );
    });

    it('reports a referenced hash the server holds no content for rather than completion', async () => {
      await sequelize.query(
        `INSERT INTO attachments (id, type, size, hash) VALUES ($id, 'image/png', 4, $hash)`,
        { bind: { id: randomUUID(), hash: `sha256:${'d'.repeat(64)}` } },
      );

      await makeTask({ batchSize: 10, batchSleepAsyncDurationInMilliseconds: 0 }).run();

      expect(messagesOf(warn)).toContain(
        'BlobBackfillTask: complete except for content this server does not hold',
      );
      expect(messagesOf(info)).not.toContain(
        'BlobBackfillTask: complete, no in-database blob content remains',
      );
    });
  });
});
