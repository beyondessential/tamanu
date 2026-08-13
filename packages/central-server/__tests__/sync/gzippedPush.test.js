import { gzipSync } from 'node:zlib';
import { beforeAll, describe, it } from '@jest/globals';
import { fake } from '@tamanu/fake-data/fake';
import { DEVICE_SCOPES, SERVER_TYPES } from '@tamanu/constants';
import { countSyncSnapshotRecords, SYNC_SESSION_DIRECTION } from '@tamanu/database/sync';

import { createTestContext } from '../utilities';

// Mobile clients gzip their push bodies and rely on body-parser's inflate
// support (enabled by default) to decompress them on the way in
describe('sync push with gzipped request body', () => {
  let ctx;
  let models;
  let baseApp;
  let user;
  let token;

  const deviceId = 'gzip-push-device';
  const facilityId = 'gzip-push-facility';

  const makeChanges = count =>
    Array.from({ length: count }, (_, i) => ({
      direction: SYNC_SESSION_DIRECTION.OUTGOING,
      recordType: 'patients',
      recordId: `gzip-push-patient-${i}`,
      isDeleted: false,
      data: {
        id: `gzip-push-patient-${i}`,
        display_id: `GZIP${i}`,
        first_name: 'Gzip',
        last_name: `Push${i}`,
        updated_at_sync_tick: 1,
      },
    }));

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
    expect(response.body).toHaveProperty('status', 'goodToGo');
    return response.body.sessionId;
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;

    user = await models.User.create(fake(models.User, { password: 'password', role: 'admin' }));
    await models.Facility.create(fake(models.Facility, { id: facilityId, name: facilityId }));
    await models.Device.create(
      fake(models.Device, {
        id: deviceId,
        registeredById: user.id,
        scopes: [DEVICE_SCOPES.SYNC_CLIENT],
      }),
    );

    const { CentralSyncManager } = require('../../app/sync/CentralSyncManager');
    CentralSyncManager.overrideConfig({
      sync: {
        awaitPreparation: true,
        maxConcurrentSessions: 10,
        maxRecordsPerSnapshotChunk: 1000000000,
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

  it('accepts a gzipped push body and stores the inflated changes', async () => {
    const sessionId = await startSyncSession();
    const changes = makeChanges(50);

    const response = await baseApp
      .post(`/api/sync/${sessionId}/push`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tamanu-Client', SERVER_TYPES.MOBILE)
      .set('Content-Type', 'application/json')
      .set('Content-Encoding', 'gzip')
      .send(gzipSync(Buffer.from(JSON.stringify({ changes }))));

    expect(response).toHaveSucceeded();
    const count = await countSyncSnapshotRecords(
      ctx.store.sequelize,
      sessionId,
      SYNC_SESSION_DIRECTION.INCOMING,
      'patients',
    );
    expect(count).toEqual(changes.length);
  });

  it('still accepts a plain JSON push body', async () => {
    const sessionId = await startSyncSession();
    const changes = makeChanges(5);

    const response = await baseApp
      .post(`/api/sync/${sessionId}/push`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tamanu-Client', SERVER_TYPES.MOBILE)
      .send({ changes });

    expect(response).toHaveSucceeded();
    const count = await countSyncSnapshotRecords(
      ctx.store.sequelize,
      sessionId,
      SYNC_SESSION_DIRECTION.INCOMING,
      'patients',
    );
    expect(count).toEqual(changes.length);
  });
});
