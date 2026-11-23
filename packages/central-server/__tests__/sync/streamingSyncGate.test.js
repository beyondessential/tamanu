import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DEVICE_SCOPES, SERVER_TYPES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';

import { createTestContext } from '../utilities';

const DEVICE_ID = 'streaming-gate-device';

describe('Streaming sync routes while unreleased', () => {
  let ctx;
  let baseApp;
  let token;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    const { models } = ctx.store;

    const user = await models.User.create(fake(models.User, { password: 'password' }));
    await models.Device.create(
      fake(models.Device, {
        id: DEVICE_ID,
        registeredById: user.id,
        scopes: [DEVICE_SCOPES.SYNC_CLIENT],
      }),
    );

    const login = await baseApp
      .post('/api/login')
      .set('X-Tamanu-Client', SERVER_TYPES.FACILITY)
      .send({
        email: user.email,
        password: 'password',
        deviceId: DEVICE_ID,
        scopes: [DEVICE_SCOPES.SYNC_CLIENT],
      });
    expect(login).toHaveSucceeded();
    token = login.body.token;
  });

  afterAll(() => ctx.close());

  // The session does not exist, so a route that did any work would fail differently
  it.each(['ready/stream', 'pull/ready/stream', 'pull/stream'])(
    'refuses GET /sync/:sessionId/%s',
    async path => {
      const response = await baseApp
        .get(`/api/sync/no-such-session/${path}`)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Tamanu-Client', SERVER_TYPES.FACILITY);

      expect(response.status).toBe(501);
      expect(response.body.detail).toBe('Streaming sync is not ready for release');
    },
  );
});
