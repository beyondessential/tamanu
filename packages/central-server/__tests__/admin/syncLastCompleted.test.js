import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { DEVICE_SCOPES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
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

  const createCompletedSession = async ({ facilityIds, completedAt, deletedAt = null }) => {
    const id = fakeUUID();
    await models.SyncSession.create({
      id,
      startTime: completedAt,
      lastConnectionTime: completedAt,
      completedAt,
      debugInfo: { totalToPull: 0 },
      parameters: { facilityIds },
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

  // spec: CEND
  describe('central endpoint', () => {
    const createDevice = async fields => {
      const user = await models.User.create(fake(models.User));
      return models.Device.create(
        fake(models.Device, {
          registeredById: user.id,
          scopes: [DEVICE_SCOPES.SYNC_CLIENT],
          // fake() fills nullable columns, so say explicitly that nothing was reported
          centralEndpoint: null,
          centralEndpointReportedAt: null,
          ...fields,
        }),
      );
    };

    const createSessionFor = async ({ device, isMobile = false }) => {
      const facilityIds = [`facility-${fakeUUID()}`];
      const completedAt = new Date('2024-06-01');
      await models.SyncSession.create({
        startTime: completedAt,
        lastConnectionTime: completedAt,
        completedAt,
        debugInfo: { totalToPull: 0 },
        parameters: { facilityIds, deviceId: device.id, isMobile },
      });
      return facilityIds;
    };

    const fetchRow = async facilityIds => {
      const app = await baseApp.asRole('admin');
      const result = await app.get(ENDPOINT);
      expect(result).toHaveSucceeded();
      return result.body.data.find(r => r.facilityIds?.[0] === facilityIds[0]);
    };

    it('shows the endpoint most recently reported by the row’s device, and when', async () => {
      const reportedAt = new Date('2024-07-01T00:00:00Z');
      const device = await createDevice({
        centralEndpoint: 'https://central.example.com',
        centralEndpointReportedAt: reportedAt,
      });
      const facilityIds = await createSessionFor({ device });

      const row = await fetchRow(facilityIds);
      expect(row.endpoint).toBe('https://central.example.com');
      expect(new Date(row.endpointReportedAt)).toEqual(reportedAt);
    });

    it('shows neither for a device that has never reported', async () => {
      const device = await createDevice({});
      const facilityIds = await createSessionFor({ device });

      const row = await fetchRow(facilityIds);
      expect(row.endpoint).toBeNull();
      expect(row.endpointReportedAt).toBeNull();
    });

    it('shows neither for a mobile device that has never reported', async () => {
      const device = await createDevice({});
      const facilityIds = await createSessionFor({ device, isMobile: true });

      const row = await fetchRow(facilityIds);
      expect(row.deviceType).toBe('mobile');
      expect(row.endpoint).toBeNull();
    });

    it.each(['endpoint', 'endpointReportedAt'])('can sort by %s', async orderBy => {
      const app = await baseApp.asRole('admin');
      const result = await app.get(ENDPOINT).query({ orderBy });
      expect(result).toHaveSucceeded();
    });
  });
});
