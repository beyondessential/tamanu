import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { fakeUUID } from '@tamanu/utils/generateId';

import { createTestContext } from '../utilities';

const ENDPOINT = '/api/admin/sync/lastCompleted';

describe('GET /admin/sync/lastCompleted', () => {
  let ctx;
  let baseApp;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    ({ models } = ctx.store);
  });
  afterAll(() => ctx.close());
  afterEach(() => models.SyncSession.truncate({ force: true, cascade: true }));

  const createCompletedSession = async ({
    facilityIds,
    completedAt,
    deletedAt = null,
    parameters = {},
    debugInfo = {},
  }) => {
    const id = fakeUUID();
    await models.SyncSession.create({
      id,
      startTime: completedAt,
      lastConnectionTime: completedAt,
      completedAt,
      debugInfo,
      parameters: { facilityIds, ...parameters },
    });
    if (deletedAt) {
      // paranoid destroy sets deleted_at rather than removing the row
      await models.SyncSession.destroy({ where: { id } });
    }
    return id;
  };

  it('rejects unauthenticated requests', async () => {
    const result = await baseApp.get(ENDPOINT);
    expect(result).toHaveRequestError();
  });

  it('lists the most recently completed session per facility', async () => {
    const facilityIds = [`facility-${fakeUUID()}`];
    await createCompletedSession({ facilityIds, completedAt: new Date('2024-01-01') });
    await createCompletedSession({ facilityIds, completedAt: new Date('2024-06-01') });

    const app = await baseApp.asRole('admin');
    const result = await app.get(ENDPOINT);

    expect(result).toHaveSucceeded();
    const row = result.body.data.find(r => r.facilityIds?.[0] === facilityIds[0]);
    expect(row).toBeTruthy();
    expect(new Date(row.completedAt)).toEqual(new Date('2024-06-01'));
  });

  it.each([
    ['the session parameters', { parameters: { totalToPull: 42 } }],
    ['debug info, for sessions from before it moved', { debugInfo: { totalToPull: 42 } }],
  ])('reports records pulled from %s', async (_source, totals) => {
    const facilityIds = [`facility-${fakeUUID()}`];
    await createCompletedSession({ facilityIds, completedAt: new Date('2024-01-01'), ...totals });

    const app = await baseApp.asRole('admin');
    const result = await app.get(ENDPOINT);

    expect(result).toHaveSucceeded();
    const row = result.body.data.find(r => r.facilityIds?.[0] === facilityIds[0]);
    expect(row.recordsPulled).toEqual(42);
  });

  it('excludes a facility whose only completed session has been soft-deleted', async () => {
    const facilityIds = [`facility-${fakeUUID()}`];
    await createCompletedSession({
      facilityIds,
      completedAt: new Date('2024-01-01'),
      deletedAt: new Date(),
    });

    const app = await baseApp.asRole('admin');
    const result = await app.get(ENDPOINT);

    // Before the fix, the raw grouping query would still surface this facility
    // (it doesn't check deleted_at), then the follow-up SyncSession.findOne
    // (which is paranoid) would find nothing and the handler would throw
    // trying to read .parameters off a null session, so this asserts both
    // that the request succeeds and that the facility is omitted.
    expect(result).toHaveSucceeded();
    const row = result.body.data.find(r => r.facilityIds?.[0] === facilityIds[0]);
    expect(row).toBeUndefined();
  });

  it('still lists a facility when only its older session is soft-deleted', async () => {
    const facilityIds = [`facility-${fakeUUID()}`];
    await createCompletedSession({
      facilityIds,
      completedAt: new Date('2024-01-01'),
      deletedAt: new Date(),
    });
    await createCompletedSession({ facilityIds, completedAt: new Date('2024-06-01') });

    const app = await baseApp.asRole('admin');
    const result = await app.get(ENDPOINT);

    expect(result).toHaveSucceeded();
    const row = result.body.data.find(r => r.facilityIds?.[0] === facilityIds[0]);
    expect(row).toBeTruthy();
    expect(new Date(row.completedAt)).toEqual(new Date('2024-06-01'));
  });
});
