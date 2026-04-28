import waitForExpect from 'wait-for-expect';
import { settingsCache } from '@tamanu/settings';
import { buildSettings } from '@tamanu/settings/reader';
import { SETTINGS_SCOPES } from '@tamanu/constants';
import { sleepAsync } from '@tamanu/utils/sleepAsync';
import { createTestContext } from '../utilities';
import { createSetting } from './settingsUtils';

// Long enough to let the debounced NOTIFY-driven cache reset fire (debounce is 50ms in the
// invalidator). Used to drain any in-flight reset before the next test populates the cache.
const NOTIFY_DEBOUNCE_DRAIN_MS = 100;

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
    // Drain any pending debounced NOTIFY-driven cache reset before the next test starts,
    // so a stale NOTIFY from this test's writes can't reset the cache mid-next-test
    // (which would invalidate buildSettings call-count assertions).
    await sleepAsync(NOTIFY_DEBOUNCE_DRAIN_MS);
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

  it('It should invalidate cache if a new row is added to the settings table', async () => {
    // Call readSetting, it should store that in cache
    await settings.get('timezone');

    // Create a new settings on database should invalidate the cache
    await createSetting(models, 'new-database-key', 'new-database-value', SETTINGS_SCOPES.GLOBAL);

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

    // Raw SQL bypasses Sequelize hooks, so we have to wait for the debounced NOTIFY-driven
    // listener to invalidate the cache before reading.
    await waitForExpect(() => expect(settingsCache.has()).toBe(false));

    await settings.get('timezone');

    expect(buildSettings).toHaveBeenCalledTimes(2);
  });
});
