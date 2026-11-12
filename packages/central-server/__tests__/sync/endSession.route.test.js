import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DEVICE_SCOPES, SERVER_TYPES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { CentralSyncManager } from '../../app/sync/CentralSyncManager';
import { createTestContext } from '../utilities';

// A sync client whose request to end its session got through, but which never saw the response,
// repeats the request
describe('ending a sync session over HTTP', () => {
  let ctx;
  let models;
  let baseApp;
  let token;

  const deviceId = 'end-session-device';
  const facilityId = 'end-session-facility';

  const startSyncSession = async () => {
    const response = await baseApp
      .post('/api/sync')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tamanu-Client', SERVER_TYPES.MOBILE)
      .send({
        facilityIds: [facilityId],
        lastSyncedTick: 0,
        isMobile: true,
      });
    expect(response).toHaveSucceeded();
    return response.body.sessionId;
  };

  const endSyncSession = sessionId =>
    baseApp
      .delete(`/api/sync/${sessionId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tamanu-Client', SERVER_TYPES.MOBILE);

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;

    const user = await models.User.create(
      fake(models.User, { password: 'password', role: 'admin' }),
    );
    await models.Facility.create(fake(models.Facility, { id: facilityId, name: facilityId }));
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
        maxRecordsPerSnapshotChunk: 1_000_000_000,
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

  afterAll(() => ctx.close());

  it('responds with no content, and does so again when the request is repeated', async () => {
    const sessionId = await startSyncSession();

    const firstResponse = await endSyncSession(sessionId);
    expect(firstResponse.status).toBe(204);
    expect(firstResponse.text).toBe('');

    const repeatedResponse = await endSyncSession(sessionId);
    expect(repeatedResponse.status).toBe(204);
    expect(repeatedResponse.text).toBe('');

    const session = await models.SyncSession.findByPk(sessionId);
    expect(session.completedAt).toBeTruthy();
    expect(session.errors).toBeNull();
  });
});
