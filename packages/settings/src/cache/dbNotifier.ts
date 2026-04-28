import { debounce } from 'lodash';
import { SETTINGS_SCOPES } from '@tamanu/constants';
import { settingsCache as defaultSettingsCache, SettingsCache } from './settingsCache';

const SETTINGS_TABLE = 'settings';

// `maxWait` ensures a steady stream of writes (e.g. a migration touching many rows)
// can't defer the reset indefinitely — it would otherwise keep getting re-armed.
const RESET_DEBOUNCE_MS = 50;
const RESET_MAX_WAIT_MS = 200;

const ALL_FACILITIES_KEY = '__all__';
const CENTRAL_BUCKET_KEY = '__central__';

interface TableChangedPayload {
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  oldId?: string;
  newId?: string;
  changedColumns?: string[];
  scope?: string;
  facilityId?: string | null;
  key?: string;
}

type OnTableChanged = (callback: (payload: TableChangedPayload) => void) => void;

// Returns the cache buckets affected by a change, or `null` to mean "reset everything".
// `undefined` in the array represents the no-facility ('central') cache.
const getAffectedBuckets = (payload: TableChangedPayload): (string | undefined)[] | null => {
  if (!payload.scope) return null;
  if (payload.scope === SETTINGS_SCOPES.GLOBAL) return null;
  if (payload.scope === SETTINGS_SCOPES.CENTRAL) return [undefined];
  if (payload.scope === SETTINGS_SCOPES.FACILITY) {
    return payload.facilityId ? [payload.facilityId] : null;
  }
  return null;
};

/**
 * Subscribes to `table_changed` NOTIFYs and invalidates the in-memory settings cache
 * when the settings table changes. The DB-level trigger ensures invalidation also
 * fires for raw SQL and migrations, not just Sequelize writes.
 *
 * Per-bucket debouncers (driven by `scope`/`facilityId` in the payload) avoid
 * blowing away every facility's cache for an unrelated change.
 */
export const registerSettingsCacheInvalidator = (
  onTableChanged: OnTableChanged,
  cache: SettingsCache = defaultSettingsCache,
): void => {
  const debouncers = new Map<string, ReturnType<typeof debounce>>();

  const debouncerFor = (bucketKey: string, doReset: () => void) => {
    let fn = debouncers.get(bucketKey);
    if (!fn) {
      fn = debounce(doReset, RESET_DEBOUNCE_MS, {
        leading: true,
        trailing: true,
        maxWait: RESET_MAX_WAIT_MS,
      });
      debouncers.set(bucketKey, fn);
    }
    return fn;
  };

  onTableChanged((payload) => {
    if (payload.table !== SETTINGS_TABLE) return;

    const buckets = getAffectedBuckets(payload);
    if (buckets === null) {
      debouncerFor(ALL_FACILITIES_KEY, () => cache.reset())();
      return;
    }
    for (const facilityId of buckets) {
      const key = facilityId ?? CENTRAL_BUCKET_KEY;
      debouncerFor(key, () => cache.reset(facilityId))();
    }
  });
};
