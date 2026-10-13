import { describe, expect, it } from 'vitest';
import { SettingsCache } from '../src/cache/settingsCache';
import { registerSettingsCacheInvalidator } from '../src/cache/dbNotifier';

const setup = () => {
  const cache = new SettingsCache();
  cache.setAllSettings({ some: 'value' });
  let tableChanged;
  let reconnected;
  registerSettingsCacheInvalidator(
    callback => (tableChanged = callback),
    cache,
    callback => (reconnected = callback),
  );
  return { cache, tableChanged, reconnected };
};

describe('registerSettingsCacheInvalidator', () => {
  it('resets the cache when the settings table changes', () => {
    const { cache, tableChanged } = setup();
    tableChanged({ table: 'settings', event: 'UPDATE' });
    expect(cache.has()).toBe(false);
  });

  it('ignores changes to other tables', () => {
    const { cache, tableChanged } = setup();
    tableChanged({ table: 'patients', event: 'UPDATE' });
    expect(cache.has()).toBe(true);
  });

  it('resets the cache when the listener reconnects, as changes in the gap were missed', () => {
    const { cache, reconnected } = setup();
    reconnected();
    expect(cache.has()).toBe(false);
  });
});
