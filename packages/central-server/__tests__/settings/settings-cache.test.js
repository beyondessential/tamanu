import waitForExpect from 'wait-for-expect';
import { settingsCache } from '@tamanu/settings';
import { buildSettings } from '@tamanu/settings/reader';
import { SETTINGS_SCOPES } from '@tamanu/constants';
import { sleepAsync } from '@tamanu/utils/sleepAsync';
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
  let settings;
  beforeAll(async () => {
    ctx = await createTestContext();
    settings = ctx.settings;
    models = ctx.store.models;
    jest.clearAllMocks();
  });

  beforeEach(() => {
    settingsCache.reset();
  });

  afterAll(() => ctx.close());

  afterEach(async () => {
    await models.Setting.destroy({ where: {}, force: true });
    // Allow any in-flight pg NOTIFY messages from this test (or its cleanup) to be
    // delivered before we move on, so they don't invalidate the cache mid-way
    // through the next test.
    await sleepAsync(150);
    settingsCache.reset();
    buildSettings.mockClear();
  });

  it('Should use cached value if in ttl', async () => {
    // Call readSetting, it should store that in cache
    const value = await settings.get('timezone');
    expect(value).toEqual('gmt-3');

    // Calling it again should not call build settings method
    await settings.get('timezone');

    // Ensure buildSettings was called once
    expect(buildSettings).toHaveBeenCalledTimes(1);
  });

  it('Should not use cache if timestamp is not in ttl', async () => {
    // Call .get should store that in cache
    const value = await settings.get('timezone');
    expect(value).toEqual('gmt-3');

    const mockTimestamp = Date.now() + settingsCache.ttl + 1; // Simulate an expired cache
    Date.now = jest.fn(() => mockTimestamp);

    // Calling it again should not call build settings method
    await settings.get('timezone');

    // buildSettings should be called twice
    expect(buildSettings).toHaveBeenCalledTimes(2);
  });

  // Cache invalidation now happens via a Postgres NOTIFY listener, so we wait
  // for the cache to be reset before asserting that buildSettings was called again.
  const expectCacheInvalidated = () =>
    waitForExpect(() => expect(settingsCache.isValid()).toBeFalsy());

  it('It should invalidate cache if a new row is added to the settings table', async () => {
    // Call readSetting, it should store that in cache
    await settings.get('timezone');

    // Create a new settings on database should invalidate the cache
    await createSetting(models, 'new-database-key', 'new-database-value', SETTINGS_SCOPES.GLOBAL);
    await expectCacheInvalidated();

    // Calling it after creating a new row should call build settings one more time
    await settings.get(models, 'new-database-key');

    // buildSettings should be called twice
    expect(buildSettings).toHaveBeenCalledTimes(2);
  });

  it('It should invalidate cache if a row is deleted the settings table', async () => {
    await createSetting(models, 'new-database-key', 'new-database-value', SETTINGS_SCOPES.GLOBAL);
    // Call readSetting, it should store that in cache
    await settings.get('timezone');
    await models.Setting.destroy({ where: {}, force: true });
    await expectCacheInvalidated();

    // Calling it after deleting a row should call build settings one more time
    await settings.get('timezone');

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
    await settings.get('timezone');

    await setting.update({ key: 'updated-key' });
    await expectCacheInvalidated();

    // Calling it after deleting a row should call build settings one more time
    await settings.get('timezone');

    // buildSettings should be called twice
    expect(buildSettings).toHaveBeenCalledTimes(2);
  });

  it('It should invalidate cache when settings change via raw SQL (no Sequelize hook)', async () => {
    await settings.get('timezone');

    await models.Setting.sequelize.query(
      `INSERT INTO settings (id, key, value, scope) VALUES (gen_random_uuid(), 'raw-sql-key', '"raw-sql-value"', :scope)`,
      { replacements: { scope: SETTINGS_SCOPES.GLOBAL } },
    );
    await expectCacheInvalidated();

    await settings.get('timezone');

    expect(buildSettings).toHaveBeenCalledTimes(2);
  });
});
