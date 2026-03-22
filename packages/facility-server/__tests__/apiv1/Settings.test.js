import { createTestContext } from '../utilities';
import { settingsCache } from '@tamanu/settings';

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
          expirationTimestamps: new Map(),
        }),
      );
    });
    it('requires admin permissions', async () => {
      const res = await userApp.delete('/v1/admin/settings/cache');
      expect(res).toBeForbidden();
    });
  });
});
