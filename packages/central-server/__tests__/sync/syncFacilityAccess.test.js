import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DEVICE_SCOPES, SERVER_TYPES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { CentralSyncManager } from '../../app/sync/CentralSyncManager';
import { sleepAsync } from '@tamanu/utils/sleepAsync';
import { createTestContext } from '../utilities';

// A user restricted to the facilities they're linked to may sync those, and only those.
describe('sync facility access', () => {
  let ctx;
  let models;
  let baseApp;
  let token;
  let user;

  const deviceId = 'facility-access-device';
  const allowedFacilityId = 'facility-access-allowed';
  const otherFacilityId = 'facility-access-other';

  const withClient = (request, bearerToken) =>
    request
      .set('Authorization', `Bearer ${bearerToken}`)
      .set('X-Tamanu-Client', SERVER_TYPES.MOBILE);
  const postAs = (bearerToken, endpoint, body) =>
    withClient(baseApp.post(endpoint), bearerToken).send(body);
  const getAs = (bearerToken, endpoint) => withClient(baseApp.get(endpoint), bearerToken);
  const post = (endpoint, body) => postAs(token, endpoint, body);

  const registerDevice = (registeringUser, id) =>
    models.Device.create(
      fake(models.Device, {
        id,
        registeredById: registeringUser.id,
        scopes: [DEVICE_SCOPES.SYNC_CLIENT],
      }),
    );

  const login = async (loginUser, loginDeviceId) => {
    const loginResponse = await baseApp
      .post('/api/login')
      .set('X-Tamanu-Client', SERVER_TYPES.MOBILE)
      .send({
        email: loginUser.email,
        password: 'password',
        deviceId: loginDeviceId,
        scopes: [DEVICE_SCOPES.SYNC_CLIENT],
      });
    expect(loginResponse).toHaveSucceeded();
    return loginResponse.body.token;
  };

  const startSession = async (bearerToken = token) => {
    const response = await postAs(bearerToken, '/api/sync', {
      facilityIds: [allowedFacilityId],
      lastSyncedTick: 0,
      isMobile: true,
    });
    expect(response).toHaveSucceeded();
    expect(response.body.status).toBe('goodToGo');
    return response.body.sessionId;
  };

  // the snapshot runs in the background, so let it finish before the test moves on
  const waitForPullReady = async sessionId => {
    for (let attempt = 0; attempt < 100; attempt++) {
      const response = await getAs(token, `/api/sync/${sessionId}/pull/ready`);
      expect(response).toHaveSucceeded();
      if (response.body === true) return;
      await sleepAsync(100);
    }
    throw new Error('Pull snapshot did not complete');
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;

    await models.Setting.set('auth.restrictUsersToFacilities', true);
    const role = await models.Role.create(fake(models.Role));
    user = await models.User.create(fake(models.User, { password: 'password', role: role.id }));
    await models.Facility.create(fake(models.Facility, { id: allowedFacilityId }));
    await models.Facility.create(fake(models.Facility, { id: otherFacilityId }));
    await models.UserFacility.create({ userId: user.id, facilityId: allowedFacilityId });
    await registerDevice(user, deviceId);

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

    token = await login(user, deviceId);
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

  describe('pulling', () => {
    it('pulls for the facilities the session was started for', async () => {
      const sessionId = await startSession();
      const response = await post(`/api/sync/${sessionId}/pull/initiate`, {
        since: 0,
        facilityIds: [allowedFacilityId],
      });
      expect(response).toHaveSucceeded();
      await waitForPullReady(sessionId);
    });

    it("pulls for the session's facilities when the request names none", async () => {
      const sessionId = await startSession();
      const response = await post(`/api/sync/${sessionId}/pull/initiate`, { since: 0 });
      expect(response).toHaveSucceeded();
      await waitForPullReady(sessionId);
    });

    it('refuses a pull naming a facility the session was not started for', async () => {
      const sessionId = await startSession();
      expect(
        await post(`/api/sync/${sessionId}/pull/initiate`, {
          since: 0,
          facilityIds: [otherFacilityId],
        }),
      ).toBeForbidden();
      expect(
        await post(`/api/sync/${sessionId}/pull/initiate`, {
          since: 0,
          facilityIds: [allowedFacilityId, otherFacilityId],
        }),
      ).toBeForbidden();
    });
  });

  describe('session ownership', () => {
    let otherUserToken;
    let otherDeviceToken;

    beforeAll(async () => {
      const role = await models.Role.create(fake(models.Role));
      const otherUser = await models.User.create(
        fake(models.User, { password: 'password', role: role.id }),
      );
      await models.UserFacility.create({ userId: otherUser.id, facilityId: allowedFacilityId });
      await registerDevice(otherUser, 'facility-access-other-user-device');
      otherUserToken = await login(otherUser, 'facility-access-other-user-device');

      await registerDevice(user, 'facility-access-second-device');
      otherDeviceToken = await login(user, 'facility-access-second-device');
    });

    it.each([
      ['another user', () => otherUserToken],
      ['the same user on another device', () => otherDeviceToken],
    ])('refuses a session to %s', async (_caller, getCallerToken) => {
      const sessionId = await startSession();
      const callerToken = getCallerToken();

      expect(await getAs(callerToken, `/api/sync/${sessionId}/ready`)).toBeForbidden();
      expect(await getAs(callerToken, `/api/sync/${sessionId}/metadata`)).toBeForbidden();
      expect(
        await postAs(callerToken, `/api/sync/${sessionId}/pull/initiate`, {
          since: 0,
          facilityIds: [allowedFacilityId],
        }),
      ).toBeForbidden();
      expect(await getAs(callerToken, `/api/sync/${sessionId}/pull`)).toBeForbidden();
      expect(
        await postAs(callerToken, `/api/sync/${sessionId}/push`, { changes: [] }),
      ).toBeForbidden();
      expect(
        await postAs(callerToken, `/api/sync/${sessionId}/error`, { error: 'hijacked' }),
      ).toBeForbidden();
      expect(
        await withClient(baseApp.delete(`/api/sync/${sessionId}`), callerToken),
      ).toBeForbidden();

      // the owner's session is untouched by the refused calls
      expect(await getAs(token, `/api/sync/${sessionId}/ready`)).toHaveSucceeded();
    });
  });
});
