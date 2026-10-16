import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { DEVICE_SCOPES, SERVER_TYPES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';

import { CentralSyncManager } from '../../app/sync/CentralSyncManager';
import { createTestContext } from '../utilities';

// spec: CEND
describe('reporting the central endpoint on sync start', () => {
  let ctx;
  let models;
  let baseApp;
  let user;
  let token;

  const deviceId = 'endpoint-report-device';
  const facilityId = 'endpoint-report-facility';

  const startSync = async body => {
    const response = await baseApp
      .post('/api/sync')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tamanu-Client', SERVER_TYPES.FACILITY)
      .send({ facilityIds: [facilityId], lastSyncedTick: 0, ...body });
    expect(response).toHaveSucceeded();
    return response;
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
      .set('X-Tamanu-Client', SERVER_TYPES.FACILITY)
      .send({
        email: user.email,
        password: 'password',
        deviceId,
        scopes: [DEVICE_SCOPES.SYNC_CLIENT],
      });
    expect(loginResponse).toHaveSucceeded();
    token = loginResponse.body.token;
  });

  beforeEach(async () => {
    await models.SyncSession.truncate({ cascade: true, force: true });
    await models.SyncQueuedDevice.truncate({ cascade: true, force: true });
    await models.Device.update(
      { centralEndpoint: null, centralEndpointReportedAt: null },
      { where: { id: deviceId } },
    );
  });

  afterAll(() => ctx.close());

  it('records the reported endpoint on the session and the device', async () => {
    const before = Date.now();
    const { body } = await startSync({ endpoint: 'https://central.example.com' });

    const session = await models.SyncSession.findByPk(body.sessionId);
    expect(session.parameters.endpoint).toBe('https://central.example.com');

    const device = await models.Device.findByPk(deviceId);
    expect(device.centralEndpoint).toBe('https://central.example.com');
    expect(device.centralEndpointReportedAt.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('stores the endpoint in canonical form', async () => {
    const { body } = await startSync({ endpoint: 'https://Central.Example.COM/' });

    const session = await models.SyncSession.findByPk(body.sessionId);
    expect(session.parameters.endpoint).toBe('https://central.example.com');
  });

  it('keeps the latest endpoint a device reports', async () => {
    await startSync({ endpoint: 'https://old.example.com' });
    await models.SyncSession.truncate({ cascade: true, force: true });
    await startSync({ endpoint: 'http://central.local:3000' });

    const device = await models.Device.findByPk(deviceId);
    expect(device.centralEndpoint).toBe('http://central.local:3000');
  });

  it('records the endpoint a mobile device reports', async () => {
    const { body } = await startSync({ isMobile: true, endpoint: 'https://central.example.com/' });

    const session = await models.SyncSession.findByPk(body.sessionId);
    expect(session.parameters).toMatchObject({
      isMobile: true,
      endpoint: 'https://central.example.com',
    });
    const device = await models.Device.findByPk(deviceId);
    expect(device.centralEndpoint).toBe('https://central.example.com');
  });

  it('leaves the device alone when no endpoint is reported', async () => {
    const { body } = await startSync({});

    const session = await models.SyncSession.findByPk(body.sessionId);
    expect(session.parameters).not.toHaveProperty('endpoint');

    const device = await models.Device.findByPk(deviceId);
    expect(device.centralEndpoint).toBeNull();
    expect(device.centralEndpointReportedAt).toBeNull();
  });

  it('ignores an endpoint it cannot read rather than refusing the sync', async () => {
    const { body } = await startSync({ endpoint: 'https://central.example.com/with/path' });
    expect(body.status).toBe('goodToGo');

    const device = await models.Device.findByPk(deviceId);
    expect(device.centralEndpoint).toBeNull();
  });
});
