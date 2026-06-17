import { sub } from 'date-fns';

import { fakeUUID } from '@tamanu/utils/generateId';
import { createSnapshotTable, dropSnapshotTable } from '@tamanu/database/sync';

import { SnapshotTableCleaner } from '../../app/tasks/SnapshotTableCleaner';
import { createTestContext } from '../utilities';

describe('SnapshotTableCleaner', () => {
  let ctx;
  let models;

  const runCleaner = (overrideConfig = {}) => {
    const cleaner = new SnapshotTableCleaner(ctx, {
      schedule: '',
      enabled: false,
      retentionHours: 24,
      batchSize: 100,
      batchSleepAsyncDurationInMilliseconds: 1,
      ...overrideConfig,
    });
    return cleaner.run();
  };

  const createErroredSession = async ({ completedAt, snapshotDroppedAt = null } = {}) => {
    const id = fakeUUID();
    const when = completedAt ?? new Date();
    await models.SyncSession.create({
      id,
      startTime: when,
      lastConnectionTime: when,
      completedAt: when,
      errors: ['simulated failure'],
      snapshotDroppedAt,
    });
    await createSnapshotTable(ctx.store.sequelize, id);
    return id;
  };

  const snapshotTableExists = async (sessionId) => {
    const [rows] = await ctx.store.sequelize.query(
      `SELECT 1 FROM pg_tables WHERE schemaname = 'sync_snapshots' AND tablename = $sessionId`,
      { bind: { sessionId } },
    );
    return rows.length > 0;
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models } = ctx.store);
  });

  afterAll(() => ctx.close());

  beforeEach(async () => {
    await models.SyncSession.truncate({ cascade: true, force: true });
  });

  it('drops snapshot tables for errored sessions past the retention window', async () => {
    const sessionId = await createErroredSession({
      completedAt: sub(new Date(), { hours: 25 }),
    });

    await runCleaner();

    const session = await models.SyncSession.findByPk(sessionId);
    expect(session.snapshotDroppedAt).not.toBeNull();
    expect(await snapshotTableExists(sessionId)).toBe(false);
  });

  it('leaves errored sessions within the retention window alone', async () => {
    const sessionId = await createErroredSession({
      completedAt: sub(new Date(), { hours: 1 }),
    });

    await runCleaner();

    const session = await models.SyncSession.findByPk(sessionId);
    expect(session.snapshotDroppedAt).toBeNull();
    expect(await snapshotTableExists(sessionId)).toBe(true);
    await dropSnapshotTable(ctx.store.sequelize, sessionId);
  });

  it('skips sessions that are already cleaned', async () => {
    const alreadyCleanedAt = sub(new Date(), { hours: 1 });
    const when = sub(new Date(), { hours: 48 });
    const sessionId = fakeUUID();
    await models.SyncSession.create({
      id: sessionId,
      startTime: when,
      lastConnectionTime: when,
      completedAt: when,
      errors: ['simulated failure'],
      snapshotDroppedAt: alreadyCleanedAt,
    });

    await runCleaner();

    const session = await models.SyncSession.findByPk(sessionId);
    expect(session.snapshotDroppedAt.getTime()).toBe(alreadyCleanedAt.getTime());
  });

  it('ignores successful (non-errored) sessions', async () => {
    const when = sub(new Date(), { hours: 48 });
    const sessionId = fakeUUID();
    await models.SyncSession.create({
      id: sessionId,
      startTime: when,
      lastConnectionTime: when,
      completedAt: when,
      errors: null,
      snapshotDroppedAt: null,
    });

    await runCleaner();

    const session = await models.SyncSession.findByPk(sessionId);
    expect(session.snapshotDroppedAt).toBeNull();
  });

  it('processes at most batchSize sessions per run, oldest first', async () => {
    const oldest = await createErroredSession({
      completedAt: sub(new Date(), { hours: 100 }),
    });
    const middle = await createErroredSession({
      completedAt: sub(new Date(), { hours: 50 }),
    });
    const newest = await createErroredSession({
      completedAt: sub(new Date(), { hours: 25 }),
    });

    await runCleaner({ batchSize: 2 });

    const [oldestRow, middleRow, newestRow] = await Promise.all([
      models.SyncSession.findByPk(oldest),
      models.SyncSession.findByPk(middle),
      models.SyncSession.findByPk(newest),
    ]);
    expect(oldestRow.snapshotDroppedAt).not.toBeNull();
    expect(middleRow.snapshotDroppedAt).not.toBeNull();
    expect(newestRow.snapshotDroppedAt).toBeNull();

    await dropSnapshotTable(ctx.store.sequelize, newest);
  });
});
