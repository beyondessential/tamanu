import { debounce } from 'es-toolkit/compat';
import { settingsCache as defaultSettingsCache, SettingsCache } from './settingsCache';

const SETTINGS_TABLE = 'settings';

// `maxWait` so a stream of writes (e.g. a migration) can't keep deferring the reset.
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

// A settings save commits each key separately, so one save arrives as a burst of
// notifications; long enough to collapse a burst, with `maxWait` so a stream of
// writes can't keep deferring it.
const CHANGE_DEBOUNCE_MS = 250;
const CHANGE_MAX_WAIT_MS = 1000;

interface SettingsPathListenerOptions {
  /** Dotted setting paths; a change at or below one of these triggers `onChange`. */
  paths: string[];
  /** Resolves the changed row to its setting key. Null when it can't be resolved. */
  resolveChangedKey: (payload: TableChangedPayload) => Promise<string | null>;
  onChange: () => void | Promise<void>;
  onError?: (error: unknown) => void;
}

const isUnderPath = (key: string, path: string) => key === path || key.startsWith(`${path}.`);

/**
 * Runs `onChange` when a setting at or below one of `paths` changes, for state
 * derived from settings that has to be rebuilt when they do.
 *
 * The notification carries the row id rather than the key, so the caller resolves
 * it. A key that can't be resolved counts as a match: a spare rebuild is cheaper
 * than a change that silently needs a restart to take effect.
 */
export const registerSettingsPathListener = (
  onTableChanged: OnTableChanged,
  { paths, resolveChangedKey, onChange, onError }: SettingsPathListenerOptions,
): void => {
  const runOnChange = debounce(
    async () => {
      try {
        await onChange();
      } catch (error) {
        onError?.(error);
      }
    },
    CHANGE_DEBOUNCE_MS,
    { maxWait: CHANGE_MAX_WAIT_MS },
  );

  onTableChanged(async (payload) => {
    if (payload.table !== SETTINGS_TABLE) return;
    try {
      const key = await resolveChangedKey(payload);
      if (key && !paths.some((path) => isUnderPath(key, path))) return;
    } catch (error) {
      onError?.(error);
    }
    runOnChange();
  });
};
