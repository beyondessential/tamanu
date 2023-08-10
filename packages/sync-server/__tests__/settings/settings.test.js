import { readSetting } from '@tamanu/shared/settings-reader/readSetting';
import { SETTINGS_SCOPES } from '@tamanu/shared/constants';
import { settingsCache } from '@tamanu/shared/settings-reader/settingsCache';
import { createTestContext } from '../utilities';
import { createSetting } from './settingsUtils';

describe('Read Settings', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    jest.clearAllMocks();
  });

  afterAll(() => ctx.close());

  afterEach(async () => {
    await models.Setting.destroy({ where: {}, force: true });
    settingsCache.reset();
  });

  xit('Read a nonexistent setting should retrieve undefined', async () => {
    const value = await readSetting(models, 'nonexistent.config');
    expect(value).toEqual(undefined);
  });

  it('Setting on DB with the scope = "central" must have priority over all others', async () => {
    await createSetting(models, 'test', 'db-global-value', SETTINGS_SCOPES.GLOBAL);
    await createSetting(models, 'test', 'db-central-value', SETTINGS_SCOPES.CENTRAL);
    const value = await readSetting(models, 'test');
    expect(value).toEqual('db-central-value');
  });

  xit('Setting on DB with the scope = "global" must have priority over default files ', async () => {});

  xit('Setting on central.js must have priority over global.js ', async () => {});

  xit('should retrieve a setting on global.js only', async () => {});
});
