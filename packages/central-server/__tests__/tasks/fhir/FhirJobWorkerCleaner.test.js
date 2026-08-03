/**
 * Tests for FhirJobWorkerCleaner (source: @tamanu/shared/tasks).
 * Run here in central-server so we avoid a circular devDependency between shared and database.
 */
import { FhirJobWorkerCleaner } from '@tamanu/shared/tasks';
import { fakeUUID } from '@tamanu/utils/generateId';

import { createTestContext } from '../../utilities';

describe('FhirJobWorkerCleaner task', () => {
  let ctx;
  let models;
  let sequelize;

  const runCleaner = () =>
    new FhirJobWorkerCleaner(ctx, { schedule: '', enabled: false }).run();

  // Insert directly so the heartbeat can be backdated: the model's timestamps
  // would otherwise stamp updated_at as now.
  const createWorker = async ({ heartbeatAge = '0 minutes', deregistered = false } = {}) => {
    const id = fakeUUID();
    await sequelize.query(
      `INSERT INTO fhir.job_workers (id, created_at, updated_at, deleted_at)
       VALUES (
         $id,
         current_timestamp - $heartbeatAge::interval,
         current_timestamp - $heartbeatAge::interval,
         CASE WHEN $deregistered THEN current_timestamp ELSE NULL END
       )`,
      { bind: { id, heartbeatAge, deregistered } },
    );
    return id;
  };

  const deletedAt = async (id) => {
    const [[row]] = await sequelize.query(
      'SELECT deleted_at FROM fhir.job_workers WHERE id = $id',
      { bind: { id } },
    );
    return row.deleted_at;
  };

  const isPruned = async (id) => (await deletedAt(id)) !== null;

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models, sequelize } = ctx.store);
    // eslint-disable-next-line require-atomic-updates
    ctx.schedules = await ctx.settings.get('schedules');
    // Pin the drop window the expectations below are written against, rather
    // than leaning on whatever the deployment's settings happen to hold.
    await models.Setting.set('fhir.worker.assumeDroppedAfter', '10 minutes');
  });

  afterAll(() => ctx.close());

  beforeEach(async () => {
    await sequelize.query('DELETE FROM fhir.job_workers');
  });

  it('prunes a worker whose heartbeat is past the drop window', async () => {
    const worker = await createWorker({ heartbeatAge: '30 minutes' });

    await runCleaner();

    expect(await isPruned(worker)).toBe(true);
  });

  it('leaves a heartbeating worker registered', async () => {
    const worker = await createWorker({ heartbeatAge: '1 minute' });

    await runCleaner();

    expect(await isPruned(worker)).toBe(false);
  });

  it('prunes only the dropped workers, leaving the live ones', async () => {
    const dropped = await createWorker({ heartbeatAge: '2 hours' });
    const live = await createWorker({ heartbeatAge: '30 seconds' });

    await runCleaner();

    expect(await isPruned(dropped)).toBe(true);
    expect(await isPruned(live)).toBe(false);
  });

  it('reports how many workers it pruned', async () => {
    await createWorker({ heartbeatAge: '2 hours' });
    await createWorker({ heartbeatAge: '3 hours' });
    await createWorker({ heartbeatAge: '30 seconds' });

    expect(await models.FhirJobWorker.clearDead()).toBe(2);
    expect(await models.FhirJobWorker.clearDead()).toBe(0);
  });

  it('leaves an already-deregistered worker as it was', async () => {
    const worker = await createWorker({ heartbeatAge: '30 minutes', deregistered: true });
    const before = await deletedAt(worker);

    await runCleaner();

    expect(await deletedAt(worker)).toEqual(before);
  });

  it('runs clean when there is nothing to prune', async () => {
    await expect(runCleaner()).resolves.not.toThrow();
  });

  it('prunes on the default window when the deployment sets no drop window', async () => {
    await sequelize.query(`DELETE FROM settings WHERE key = 'fhir.worker.assumeDroppedAfter'`);
    try {
      const worker = await createWorker({ heartbeatAge: '30 minutes' });

      await runCleaner();

      expect(await isPruned(worker)).toBe(true);
    } finally {
      await ctx.store.models.Setting.set('fhir.worker.assumeDroppedAfter', '10 minutes');
    }
  });

  it('is scheduled and enabled by the settings schema', () => {
    const cleaner = new FhirJobWorkerCleaner(ctx);
    expect(cleaner.isEnabled).toBe(true);
    expect(cleaner.schedule).toBeTruthy();
  });
});
