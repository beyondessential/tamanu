/**
 * Tests for FhirErroredJobCleaner (source: @tamanu/shared/tasks).
 * Run here in central-server so we avoid a circular devDependency between shared and database.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { subDays } from 'date-fns';

import { JOB_QUEUE_STATUSES, JOB_TOPICS } from '@tamanu/constants';
import { FhirErroredJobCleaner } from '@tamanu/shared/tasks';
import { fakeUUID } from '@tamanu/utils/generateId';

import { createTestContext } from '../../utilities';

describe('FhirErroredJobCleaner task', () => {
  let ctx;
  let models;

  const runCleaner = (overrideConfig = {}) =>
    new FhirErroredJobCleaner(ctx, {
      schedule: '',
      enabled: false,
      retentionDays: 7,
      batchSize: 1000,
      batchSleepAsyncDurationInMilliseconds: 1,
      ...overrideConfig,
    }).run();

  const createJob = async ({ status, erroredDaysAgo = null }) => {
    const erroredAt = erroredDaysAgo === null ? null : subDays(new Date(), erroredDaysAgo);
    const job = await models.FhirJob.create({
      topic: JOB_TOPICS.FHIR.REFRESH.FROM_UPSTREAM,
      discriminant: fakeUUID(),
      status,
      errored_at: erroredAt,
      error: erroredAt === null ? null : 'simulated failure',
    });
    return job.id;
  };

  const exists = async (id) => Boolean(await models.FhirJob.findByPk(id));

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models } = ctx.store);
    // eslint-disable-next-line require-atomic-updates
    ctx.schedules = await ctx.settings.get('schedules');
  });

  afterAll(() => ctx.close());

  beforeEach(async () => {
    await ctx.store.sequelize.query('DELETE FROM fhir.jobs');
  });

  it('deletes jobs that errored before the retention window', async () => {
    const job = await createJob({ status: JOB_QUEUE_STATUSES.ERRORED, erroredDaysAgo: 8 });

    await runCleaner();

    expect(await exists(job)).toBe(false);
  });

  it('keeps jobs that errored within the retention window', async () => {
    const job = await createJob({ status: JOB_QUEUE_STATUSES.ERRORED, erroredDaysAgo: 6 });

    await runCleaner();

    expect(await exists(job)).toBe(true);
  });

  it('keeps queued jobs however old they are', async () => {
    const job = await createJob({ status: JOB_QUEUE_STATUSES.QUEUED });
    await ctx.store.sequelize.query(
      `UPDATE fhir.jobs SET created_at = current_timestamp - interval '1 year',
                            updated_at = current_timestamp - interval '1 year'
       WHERE id = $id`,
      { bind: { id: job } },
    );

    await runCleaner();

    expect(await exists(job)).toBe(true);
  });

  it('deletes every eligible job across several batches', async () => {
    const jobs = [];
    for (let i = 0; i < 5; i += 1) {
      jobs.push(await createJob({ status: JOB_QUEUE_STATUSES.ERRORED, erroredDaysAgo: 30 }));
    }
    const kept = await createJob({ status: JOB_QUEUE_STATUSES.ERRORED, erroredDaysAgo: 1 });

    await runCleaner({ batchSize: 2 });

    for (const job of jobs) {
      expect(await exists(job)).toBe(false);
    }
    expect(await exists(kept)).toBe(true);
  });

  it('honours a retention window set to something other than the default', async () => {
    const job = await createJob({ status: JOB_QUEUE_STATUSES.ERRORED, erroredDaysAgo: 2 });

    await runCleaner({ retentionDays: 1 });

    expect(await exists(job)).toBe(false);
  });

  it.each([
    ['a zero batch size', { batchSize: 0 }],
    ['a missing batch size', { batchSize: undefined }],
    ['a missing retention window', { retentionDays: undefined }],
    ['a missing batch pause', { batchSleepAsyncDurationInMilliseconds: undefined }],
  ])('refuses to run with %s', async (_label, overrideConfig) => {
    await createJob({ status: JOB_QUEUE_STATUSES.ERRORED, erroredDaysAgo: 30 });

    await expect(runCleaner(overrideConfig)).rejects.toThrow('FhirErroredJobCleaner needs');
  });

  it('takes a seven-day window and its batching from the settings schema', () => {
    const cleaner = new FhirErroredJobCleaner(ctx);
    expect(cleaner.isEnabled).toBe(true);
    expect(cleaner.schedule).toBeTruthy();
    expect(cleaner.config.retentionDays).toBe(7);
    expect(cleaner.config.batchSize).toBeGreaterThan(0);
    expect(cleaner.config.batchSleepAsyncDurationInMilliseconds).toBeGreaterThan(0);
  });
});
