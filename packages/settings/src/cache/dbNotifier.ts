import { settingsCache as defaultSettingsCache, SettingsCache } from './settingsCache';

const SETTINGS_TABLE = 'settings';
const RESET_DEBOUNCE_MS = 50;

interface TableChangedPayload {
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  oldId?: string;
  newId?: string;
  changedColumns?: string[];
}

type OnTableChanged = (callback: (payload: TableChangedPayload) => void) => void;

/**
 * Subscribes to the database table_changed NOTIFY channel and resets the in-memory
 * settings cache whenever the settings table changes. Using a database-level trigger
 * means cache invalidation also fires for changes made via raw SQL or migrations,
 * not just Sequelize model writes.
 *
 * The trigger fires per-row, so a bulk operation (e.g. a migration touching many
 * rows) emits one NOTIFY per row. A short debounce collapses those bursts into a
 * single cache reset rather than rebuilding the cache between every NOTIFY.
 */
export const registerSettingsCacheInvalidator = (
  onTableChanged: OnTableChanged,
  cache: SettingsCache = defaultSettingsCache,
): void => {
  let resetTimer: ReturnType<typeof setTimeout> | null = null;
  onTableChanged((payload) => {
    if (payload.table !== SETTINGS_TABLE) return;
    if (resetTimer !== null) clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      resetTimer = null;
      cache.reset();
    }, RESET_DEBOUNCE_MS);
  });
};
