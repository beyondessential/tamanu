import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DEVICE_SCOPES, SERVER_TYPES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';

describe('Sync routes for an unavailable session', () => {
  let ctx;
  let baseApp;
  let models;
  let token;

  const deviceId = 'session-not-found-test-device';

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    ({ models } = ctx.store);

    const user = await models.User.create(
      fake(models.User, { password: 'password', role: 'admin' }),
    );
    await models.Device.create(
      fake(models.Device, {
        id: deviceId,
        registeredById: user.id,
        scopes: [DEVICE_SCOPES.SYNC_CLIENT],
      }),
    );

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

  afterAll(() => ctx.close());

  const asSyncClient = request =>
    request.set('Authorization', `Bearer ${token}`).set('X-Tamanu-Client', SERVER_TYPES.FACILITY);

  describe('unknown session', () => {
    it.each(['ready/stream', 'pull/ready/stream'])('responds 404 from %s', async endpoint => {
      const response = await asSyncClient(
        baseApp.get(`/api/sync/${crypto.randomUUID()}/${endpoint}`),
      );

      expect(response.status).toBe(404);
      expect(response.body.error.message).toBe('Session not found');
    });
  });

  describe('completed session', () => {
    let sessionId;

    beforeAll(async () => {
      sessionId = crypto.randomUUID();
      const completedAt = new Date();
      await models.SyncSession.create({
        id: sessionId,
        startTime: completedAt,
        lastConnectionTime: completedAt,
        completedAt,
      });
    });

    it('responds 410 when checking readiness', async () => {
      const response = await asSyncClient(baseApp.get(`/api/sync/${sessionId}/ready`));
      expect(response.status).toBe(410);
    });

    it('responds 410 when ending the session again', async () => {
      const response = await asSyncClient(baseApp.delete(`/api/sync/${sessionId}`));
      expect(response.status).toBe(410);
    });
  });
});
