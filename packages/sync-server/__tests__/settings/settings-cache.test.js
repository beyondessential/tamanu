import { readSetting } from '@tamanu/shared/settings-reader/readSetting';
import { SETTINGS_SCOPES } from '@tamanu/shared/constants';
import { buildSettings } from '@tamanu/shared/settings-reader/buildSettings';
import { settingsCache } from '@tamanu/shared/settings-reader/settingsCache';
import { createTestContext } from '../utilities';
import { createSetting } from './settingsUtils';

jest.mock('@tamanu/shared/settings-reader/buildSettings', () => {
  const originalModule = jest.requireActual('@tamanu/shared/settings/global');
  return {
    ...originalModule,
    buildSettings: jest.fn(() => ({ timezone: 'gmt-3' })),
  };
});

describe('Read Settings - Cache', () => {
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
    buildSettings.mockClear();
  });

  it('Should use cached value if in ttl', async () => {
    // Call readSetting, it should store that in cache
    const value = await readSetting(models, 'timezone');
    expect(value).toEqual('gmt-3');

    // Calling it again should not call build settings method
    await readSetting(models, 'timezone');

    // Ensure buildSettings was called once
    expect(buildSettings).toHaveBeenCalledTimes(1);
  });

  it('Should not use cache if timestamp is not in ttl', async () => {
    // Call readSetting, it should store that in cache
    const value = await readSetting(models, 'timezone');
    expect(value).toEqual('gmt-3');

    const mockTimestamp = Date.now() + settingsCache.ttl + 1; // Simulate an expired cache
    Date.now = jest.fn(() => mockTimestamp);

    // Calling it again should not call build settings method
    await readSetting(models, 'timezone');

    // buildSettings should be called twice
    expect(buildSettings).toHaveBeenCalledTimes(2);
  });

  it('It should invalidate cache if a new row is added to the settings table', async () => {
    // Call readSetting, it should store that in cache
    await readSetting(models, 'timezone');

    // Create a new settings on database should invalidate the cache
    await createSetting(models, 'new-database-key', 'new-database-value', SETTINGS_SCOPES.GLOBAL);

    // Calling it after creating a new row should call build settings one more time
    await readSetting(models, 'new-database-key');

    // buildSettings should be called twice
    expect(buildSettings).toHaveBeenCalledTimes(2);
  });

  it('It should invalidate cache if a row is deleted the settings table', async () => {
    await createSetting(models, 'new-database-key', 'new-database-value', SETTINGS_SCOPES.GLOBAL);
    // Call readSetting, it should store that in cache
    await readSetting(models, 'timezone');
    await models.Setting.destroy({ where: {}, force: true });

    // Calling it after deleting a row should call build settings one more time
    await readSetting(models, 'timezone');

    // buildSettings should be called twice
    expect(buildSettings).toHaveBeenCalledTimes(2);
  });

  it('It should invalidate cache if a row is updated the settings table', async () => {
    const setting = await createSetting(
      models,
      'new-database-key',
      'new-database-value',
      SETTINGS_SCOPES.GLOBAL,
    );
    // Call readSetting, it should store that in cache
    await readSetting(models, 'timezone');

    await setting.update({ key: 'updated-key' });

    // Calling it after deleting a row should call build settings one more time
    await readSetting(models, 'timezone');

    // buildSettings should be called twice
    expect(buildSettings).toHaveBeenCalledTimes(2);
  });
});
