import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DEVICE_SCOPES, SERVER_TYPES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { CentralSyncManager } from '../../app/sync/CentralSyncManager';
import { createTestContext } from '../utilities';

// A user restricted to the facilities they're linked to may sync those, and only those.
describe('sync facility access', () => {
  let ctx;
  let models;
  let baseApp;
  let token;

  const deviceId = 'facility-access-device';
  const allowedFacilityId = 'facility-access-allowed';
  const otherFacilityId = 'facility-access-other';

  const post = (endpoint, body) =>
    baseApp
      .post(endpoint)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tamanu-Client', SERVER_TYPES.MOBILE)
      .send(body);

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;

    await models.Setting.set('auth.restrictUsersToFacilities', true);
    const role = await models.Role.create(fake(models.Role));
    const user = await models.User.create(
      fake(models.User, { password: 'password', role: role.id }),
    );
    await models.Facility.create(fake(models.Facility, { id: allowedFacilityId }));
    await models.Facility.create(fake(models.Facility, { id: otherFacilityId }));
    await models.UserFacility.create({ userId: user.id, facilityId: allowedFacilityId });
    await models.Device.create(
      fake(models.Device, {
        id: deviceId,
        registeredById: user.id,
        scopes: [DEVICE_SCOPES.SYNC_CLIENT],
      }),
    );

    // overrideConfig replaces the whole config object, so every key the sync
    // session code path reads must be present here
    CentralSyncManager.overrideConfig({
      sync: {
        awaitPreparation: true,
        maxConcurrentSessions: 10,
        maxRecordsPerSnapshotChunk: 1000000000,
        lookupTable: { enabled: false },
      },
    });

    const loginResponse = await baseApp
      .post('/api/login')
      .set('X-Tamanu-Client', SERVER_TYPES.MOBILE)
      .send({
        email: user.email,
        password: 'password',
        deviceId,
        scopes: [DEVICE_SCOPES.SYNC_CLIENT],
      });
    expect(loginResponse).toHaveSucceeded();
    token = loginResponse.body.token;
  });

  afterAll(async () => {
    CentralSyncManager.restoreConfig();
    await ctx.close();
  });

  it('starts a sync session for a facility the user can access', async () => {
    const response = await post('/api/sync', {
      facilityIds: [allowedFacilityId],
      lastSyncedTick: 0,
      isMobile: true,
    });
    expect(response).toHaveSucceeded();
  });

  it('refuses a sync session for a facility the user cannot access', async () => {
    const response = await post('/api/sync', {
      facilityIds: [otherFacilityId],
      lastSyncedTick: 0,
      isMobile: true,
    });
    expect(response).toBeForbidden();
  });

  it('refuses a sync session naming any facility the user cannot access', async () => {
    const response = await post('/api/sync', {
      facilityIds: [allowedFacilityId, otherFacilityId],
      lastSyncedTick: 0,
      isMobile: true,
    });
    expect(response).toBeForbidden();
  });

  // spec: FBOOT#serving-the-bootstrap
  it('serves the bootstrap only for facilities the user can access', async () => {
    expect(
      await post('/api/sync/bootstrap', { facilityIds: [allowedFacilityId] }),
    ).toHaveSucceeded();
    expect(await post('/api/sync/bootstrap', { facilityIds: [otherFacilityId] })).toBeForbidden();
  });
});
