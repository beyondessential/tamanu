import * as jose from 'jose';
import supertest from 'supertest';

import { SERVER_TYPES, SETTINGS_SCOPES } from '@tamanu/constants';

import { createTestContext } from './utilities';
import { createApp } from '../app/createApp';
import { VERSION_CONTROLLED_CLIENTS } from '../app/middleware/versionCompatibility';

const TEST_EMAIL = 'runtime-paths@bes.au';
const TEST_PASSWORD = '1Q2Q3Q4Q';
const TEST_DEVICE_ID = 'runtime-paths-device';

const MIN_MOBILE_VERSION = VERSION_CONTROLLED_CLIENTS[SERVER_TYPES.MOBILE].min;

// Deployed-environment simulation for the config -> settings moves (TAM-6864):
// each block covers one of the three read-timing classes a moved key can have —
// per request, per action, and resolved once at boot (requiresRestart).
describe('Settings-driven runtime paths', () => {
  let ctx;
  let baseApp;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;
    const user = await models.User.create({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      displayName: 'Runtime Paths',
      role: 'admin',
    });
    await models.Device.create({ id: TEST_DEVICE_ID, registeredById: user.id });
  });

  afterAll(() => ctx.close());

  const login = async () => {
    const response = await baseApp
      .post('/api/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD, deviceId: TEST_DEVICE_ID });
    expect(response).toHaveSucceeded();
    return response.body;
  };

  describe('auth.tokenDuration (global, read at each login)', () => {
    it('uses the schema default when no setting is recorded', async () => {
      const { token } = await login();
      const { exp, iat } = jose.decodeJwt(token);
      expect(exp - iat).toEqual(60 * 60); // '1h'
    });

    it('applies an operator-set duration on the next login without a restart', async () => {
      await models.Setting.set('auth.tokenDuration', '2h', SETTINGS_SCOPES.GLOBAL);
      const { token } = await login();
      const { exp, iat } = jose.decodeJwt(token);
      expect(exp - iat).toEqual(2 * 60 * 60);
    });
  });

  describe('security.cors.allowedOrigin (central, read on each public request)', () => {
    it('serves the legacy config value through the fallback map when no setting exists', async () => {
      const response = await baseApp.get('/api/public/ping');
      expect(response).toHaveSucceeded();
      // cors.allowedOrigin from config/test.json5, served via CONFIG_TO_SETTINGS
      expect(response.headers['access-control-allow-origin']).toEqual(
        'https://fake-place-xxx-yyy.com',
      );
    });

    it('a recorded setting overrides the config fallback, without a restart', async () => {
      await models.Setting.set(
        'security.cors.allowedOrigin',
        'https://widgets.example.com',
        SETTINGS_SCOPES.CENTRAL,
      );
      const response = await baseApp.get('/api/public/ping');
      expect(response).toHaveSucceeded();
      expect(response.headers['access-control-allow-origin']).toEqual(
        'https://widgets.example.com',
      );
    });
  });

  describe('metaServer.updateUrls (global, resolved once at boot)', () => {
    const outdatedMobileRequest = agent =>
      agent.get('/').set({
        'X-Tamanu-Client': SERVER_TYPES.MOBILE,
        'X-Version': '0.0.1',
      });

    it('keeps serving the boot-time update URL after the setting changes', async () => {
      await models.Setting.set(
        'metaServer.updateUrls.mobile',
        'https://updates.example.com/~{minVersion}',
        SETTINGS_SCOPES.GLOBAL,
      );
      const response = await outdatedMobileRequest(baseApp);
      expect(response.status).toEqual(400);
      expect(JSON.parse(response.text)['update-url']).toEqual(
        `https://meta.tamanu.app/versions/~${MIN_MOBILE_VERSION}/mobile`,
      );
    });

    it('serves the new update URL after a restart', async () => {
      const { server } = await createApp(ctx);
      try {
        const response = await outdatedMobileRequest(supertest.agent(server));
        expect(response.status).toEqual(400);
        expect(JSON.parse(response.text)['update-url']).toEqual(
          `https://updates.example.com/~${MIN_MOBILE_VERSION}`,
        );
      } finally {
        server.close();
      }
    });
  });
});
