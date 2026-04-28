import { debounce } from 'lodash';
import { SETTINGS_SCOPES } from '@tamanu/constants';
import { settingsCache as defaultSettingsCache, SettingsCache } from './settingsCache';

const SETTINGS_TABLE = 'settings';

// We use leading + trailing + maxWait so that:
//   - the first NOTIFY in a burst invalidates immediately (leading edge)
//   - subsequent NOTIFYs within RESET_DEBOUNCE_MS coalesce into a single trailing reset
//   - a steady stream of writes (e.g. a long-running migration emitting one NOTIFY per
//     row) cannot defer the reset indefinitely — `maxWait` forces a reset at least every
//     RESET_MAX_WAIT_MS while changes are arriving.
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

/**
 * Determines which cache buckets a settings change affects.
 *
 * - GLOBAL: every cache (global settings are merged into both central and facility reads)
 * - CENTRAL: only the no-facility ('central') cache
 * - FACILITY: only the matching facility's cache
 * - missing/unknown scope: defensively reset all buckets
 *
 * Returns `null` for "reset everything" or an array of bucket identifiers, where
 * `undefined` represents the no-facility cache.
 */
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
 * Subscribes to the database `table_changed` NOTIFY channel and resets the in-memory
 * settings cache whenever the settings table changes. Using a database-level trigger
 * means cache invalidation also fires for changes made via raw SQL or migrations,
 * not just Sequelize model writes.
 *
 * The trigger fires per-row, so a bulk operation can emit many NOTIFYs in quick
 * succession; debouncing collapses bursts while `maxWait` guarantees bounded staleness.
 *
 * The Postgres trigger embeds `scope`/`facilityId` in the payload (see the
 * `notify_settings_changed` migration), so we only invalidate the cache buckets
 * actually affected — a CENTRAL-scoped change does not blow away every facility's
 * cached `getAll()` result.
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
