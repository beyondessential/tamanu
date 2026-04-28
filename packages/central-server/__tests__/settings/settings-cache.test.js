import waitForExpect from 'wait-for-expect';
import { settingsCache } from '@tamanu/settings';
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
    const deletedCount = await models.Setting.destroy({ where: {}, force: true });
    // If the destroy actually removed rows, wait (with a bounded timeout) for the
    // resulting NOTIFY to be delivered and invalidate the cache. This drains any
    // in-flight notifications before the next test starts, so a stale NOTIFY
    // can't reset the cache mid-test. The cache is populated by the test, so its
    // transition to empty proves the NOTIFY has been processed.
    if (deletedCount > 0) {
      await waitForExpect(() => expect(settingsCache.has()).toBe(false));
    }
    settingsCache.reset();
    buildSettings.mockClear();
  });

  it('Should use cached value once populated', async () => {
    const value = await settings.get('timezone');
    expect(value).toEqual('gmt-3');

    // Calling it again should not call build settings method
    await settings.get('timezone');

    expect(buildSettings).toHaveBeenCalledTimes(1);
  });

  // Cache invalidation now happens via a Postgres NOTIFY listener, so we wait
  // for the cache to be reset before asserting that buildSettings was called again.
  const expectCacheInvalidated = () =>
    waitForExpect(() => expect(settingsCache.has()).toBe(false));

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
