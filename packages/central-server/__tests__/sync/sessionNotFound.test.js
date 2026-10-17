import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DEVICE_SCOPES, SERVER_TYPES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';

describe('Sync stream routes for an unknown session', () => {
  let ctx;
  let baseApp;
  let token;

  const deviceId = 'session-not-found-test-device';

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    const { models } = ctx.store;

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

  it.each(['ready/stream', 'pull/ready/stream'])('responds 404 from %s', async endpoint => {
    const response = await baseApp
      .get(`/api/sync/${crypto.randomUUID()}/${endpoint}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tamanu-Client', SERVER_TYPES.FACILITY);

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe('Session not found');
  });
});
