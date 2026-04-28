import { debounce } from 'lodash';
import { settingsCache as defaultSettingsCache, SettingsCache } from './settingsCache';

const SETTINGS_TABLE = 'settings';

// `maxWait` ensures a steady stream of writes (e.g. a migration touching many rows)
// can't defer the reset indefinitely — it would otherwise keep getting re-armed.
const RESET_DEBOUNCE_MS = 50;
const RESET_MAX_WAIT_MS = 200;

interface TableChangedPayload {
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  oldId?: string;
  newId?: string;
  changedColumns?: string[];
}

type OnTableChanged = (callback: (payload: TableChangedPayload) => void) => void;

/**
 * Subscribes to `table_changed` NOTIFYs and invalidates the in-memory settings cache
 * when the settings table changes. The DB-level trigger ensures invalidation also
 * fires for raw SQL and migrations, not just Sequelize writes.
 */
export const registerSettingsCacheInvalidator = (
  onTableChanged: OnTableChanged,
  cache: SettingsCache = defaultSettingsCache,
): void => {
  const resetCache = debounce(() => cache.reset(), RESET_DEBOUNCE_MS, {
    leading: true,
    trailing: true,
    maxWait: RESET_MAX_WAIT_MS,
  });

  onTableChanged((payload) => {
    if (payload.table !== SETTINGS_TABLE) return;
    resetCache();
  });
};
