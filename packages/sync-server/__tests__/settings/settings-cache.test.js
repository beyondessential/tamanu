import { ReadSettings, settingsCache } from '@tamanu/settings';
import { buildSettings } from '@tamanu/settings/reader';
import { SETTINGS_SCOPES } from '@tamanu/constants';
import { createTestContext } from '../utilities';
import { createSetting } from './settingsUtils';

jest.mock('@tamanu/settings/reader', () => {
  const originalModule = jest.requireActual('@tamanu/settings/reader');
  return {
    ...originalModule,
    buildSettings: jest.fn(() => ({ timezone: 'gmt-3' })),
  };
});

describe('Read Settings - Cache', () => {
  let ctx;
  let models;
  let readSettings;
  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    readSettings = new ReadSettings(models);
    jest.clearAllMocks();
  });

  afterAll(() => ctx.close());

  beforeEach(() => {
    settingsCache.reset();
  });

  afterEach(async () => {
    await models.Setting.destroy({ where: {}, force: true });
    settingsCache.reset();
    buildSettings.mockClear();
  });

  it('Should use cached value if in ttl', async () => {
    // Call readSetting, it should store that in cache
    const value = await readSettings.get('timezone');
    expect(value).toEqual('gmt-3');

    // Calling it again should not call build settings method
    await readSettings.get('timezone');

    // Ensure buildSettings was called once
    expect(buildSettings).toHaveBeenCalledTimes(1);
  });

  it('Should not use cache if timestamp is not in ttl', async () => {
    // Call .get,hould store that in cache
    const value = await readSettings.get('timezone');
    expect(value).toEqual('gmt-3');

    const mockTimestamp = Date.now() + settingsCache.ttl + 1; // Simulate an expired cache
    Date.now = jest.fn(() => mockTimestamp);

    // Calling it again should not call build settings method
    await readSettings.get('timezone');

    // buildSettings should be called twice
    expect(buildSettings).toHaveBeenCalledTimes(2);
  });

  it('It should invalidate cache if a new row is added to the settings table', async () => {
    // Call readSetting, it should store that in cache
    await readSettings.get('timezone');

    // Create a new settings on database should invalidate the cache
    await createSetting(models, 'new-database-key', 'new-database-value', SETTINGS_SCOPES.GLOBAL);

    // Calling it after creating a new row should call build settings one more time
    await readSettings.get(models, 'new-database-key');

    // buildSettings should be called twice
    expect(buildSettings).toHaveBeenCalledTimes(2);
  });

  it('It should invalidate cache if a row is deleted the settings table', async () => {
    await createSetting(models, 'new-database-key', 'new-database-value', SETTINGS_SCOPES.GLOBAL);
    // Call readSetting, it should store that in cache
    await readSettings.get('timezone');
    await models.Setting.destroy({ where: {}, force: true });

    // Calling it after deleting a row should call build settings one more time
    await readSettings.get('timezone');

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
    await readSettings.get('timezone');

    await setting.update({ key: 'updated-key' });

    // Calling it after deleting a row should call build settings one more time
    await readSettings.get('timezone');

    // buildSettings should be called twice
    expect(buildSettings).toHaveBeenCalledTimes(2);
  });
});
