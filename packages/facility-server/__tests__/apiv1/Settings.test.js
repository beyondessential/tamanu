import { createTestContext } from '../utilities';
import { settingsCache } from '@tamanu/settings';
import { SETTINGS_SCOPES } from '@tamanu/constants';

describe('Settings', () => {
  let adminApp = null;
  let baseApp = null;
  let userApp = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    userApp = await baseApp.asRole('practitioner');
    adminApp = await baseApp.asRole('admin');
  });
  afterAll(() => ctx.close());

  describe('security.requireHttps enforcement', () => {
    // Set at global scope so it applies regardless of the test server's configured facility id.
    const setRequireHttps = async value => {
      await ctx.models.Setting.set('security.requireHttps', value, SETTINGS_SCOPES.GLOBAL);
      settingsCache.reset();
    };

    afterEach(async () => {
      await setRequireHttps(false);
    });

    it('rejects non-HTTPS requests when enabled', async () => {
      await setRequireHttps(true);
      const res = await userApp.get('/api/user/me');
      expect(res).toBeForbidden();
    });

    it('allows HTTPS requests (X-Forwarded-Proto) when enabled', async () => {
      await setRequireHttps(true);
      const res = await userApp.get('/api/user/me').set('X-Forwarded-Proto', 'https');
      expect(res).toHaveSucceeded();
    });

    it('allows non-HTTPS requests when disabled', async () => {
      await setRequireHttps(false);
      const res = await userApp.get('/api/user/me');
      expect(res).toHaveSucceeded();
    });
  });

  describe('DELETE /admin/settings/cache', () => {
    afterEach(() => {
      settingsCache.reset();
    });
    it('clears the settings cache', async () => {
      settingsCache.setAllSettings({ dog: 'woof' });
      const res = await adminApp.delete('/v1/admin/settings/cache');
      expect(res).toHaveSucceeded();
      expect(res.status).toEqual(204);
      expect(settingsCache).toEqual(
        expect.objectContaining({
          allSettingsCache: new Map(),
        }),
      );
    });
    it('requires admin permissions', async () => {
      const res = await userApp.delete('/v1/admin/settings/cache');
      expect(res).toBeForbidden();
    });
  });
});
