import { BROWSER_SUPPORT_POLICIES, PLATFORM_SUPPORT_POLICIES } from '@tamanu/constants';
import { settingsCache } from '@tamanu/settings';
import { createTestContext } from './utilities';

const ENDPOINT = '/v1/public/browser-support';

// Extreme version numbers so assertions don't depend on the current major
// resolved from browserslist at runtime.
const recentChrome = {
  browserName: 'Chrome',
  engineName: 'Blink',
  browserMajor: 9999,
  chromiumMajor: 9999,
  platformType: 'desktop',
};
const oldChrome = { ...recentChrome, browserMajor: 1, chromiumMajor: 1 };
const recentFirefox = {
  browserName: 'Firefox',
  engineName: 'Gecko',
  browserMajor: 9999,
  chromiumMajor: null,
  platformType: 'desktop',
};

describe('Browser support', () => {
  let ctx;
  let baseApp;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;
  });
  afterAll(async () => ctx.close());

  afterEach(async () => {
    await models.Setting.destroy({
      where: {
        key: ['browserSupport.policy', 'browserSupport.versionsBack', 'browserSupport.platform'],
      },
    });
    settingsCache.reset();
  });

  it('is reachable without authentication', async () => {
    const res = await baseApp.post(ENDPOINT).send(recentChrome);
    expect(res).toHaveSucceeded();
    expect(res.body).toEqual({ allowed: true });
  });

  describe('default settings (blink / 2 versions back / tablets)', () => {
    it('blocks an out-of-date Chromium browser with reason "browser"', async () => {
      const res = await baseApp.post(ENDPOINT).send(oldChrome);
      expect(res.body).toEqual({ allowed: false, reason: 'browser' });
    });

    it('blocks a non-Blink browser with reason "browser"', async () => {
      const res = await baseApp.post(ENDPOINT).send(recentFirefox);
      expect(res.body).toEqual({ allowed: false, reason: 'browser' });
    });

    it('blocks mobile with reason "platform"', async () => {
      const res = await baseApp.post(ENDPOINT).send({ ...recentChrome, platformType: 'mobile' });
      expect(res.body).toEqual({ allowed: false, reason: 'platform' });
    });
  });

  it('allows non-Blink browsers when the browser policy is "all"', async () => {
    await models.Setting.set('browserSupport.policy', BROWSER_SUPPORT_POLICIES.ALL);
    settingsCache.reset();
    const res = await baseApp.post(ENDPOINT).send(recentFirefox);
    expect(res.body).toEqual({ allowed: true });
  });

  it('allows mobile when the device policy is "all"', async () => {
    await models.Setting.set('browserSupport.platform', PLATFORM_SUPPORT_POLICIES.ALL);
    settingsCache.reset();
    const res = await baseApp.post(ENDPOINT).send({ ...recentChrome, platformType: 'mobile' });
    expect(res.body).toEqual({ allowed: true });
  });
});
