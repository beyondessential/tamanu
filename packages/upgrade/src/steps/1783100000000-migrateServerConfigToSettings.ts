import { FACT_DEVICE_ID, FACT_SERVER_CONFIG_MIGRATED, SETTINGS_SCOPES } from '@tamanu/constants';
import { CONFIG_TO_SETTINGS, configOverridesForScope } from '@tamanu/settings';
import { get as getAtPath } from 'es-toolkit/compat';

import type { Steps, StepArgs } from '../step.ts';
import { END } from '../step.js';
import { carrierId } from './1785000000001-migrateFacilityConfigToSettings.js';

// Flat {key, value} for each server-scoped (machine-level) config value present
// locally. Secrets and keys with no local config value are already dropped by
// configOverridesForScope.
export const serverConfigRows = () => {
  const overrides = configOverridesForScope(SETTINGS_SCOPES.SERVER);
  return CONFIG_TO_SETTINGS.filter(entry => entry.scope === SETTINGS_SCOPES.SERVER)
    .map(entry => ({ key: entry.setting, value: getAtPath(overrides, entry.setting) }))
    .filter(row => row.value !== undefined);
};

// On the first facility upgrade, snapshot each server-scoped config value into the
// FacilitySettingMigration carrier, keyed by this machine's device id. The row
// pushes up and central turns it into a device-keyed server-scope Setting, which
// syncs back down to (only) this device — central stays the single author of all
// settings rows. Fact-gated to run once; the config fallback reader serves these
// values until the setting arrives, so timing isn't load-bearing.
export const STEPS: Steps = [
  {
    at: END,
    async check({ serverType, models: { LocalSystemFact } }: StepArgs) {
      return serverType === 'facility' && !(await LocalSystemFact.get(FACT_SERVER_CONFIG_MIGRATED));
    },
    async run({ toVersion, models: { FacilitySettingMigration, LocalSystemFact } }: StepArgs) {
      const rows = serverConfigRows();
      if (rows.length) {
        const deviceId = await LocalSystemFact.get(FACT_DEVICE_ID);
        if (!deviceId) {
          // no device id means this server has never initialised — nothing to
          // migrate yet; leave the fact unset so the next upgrade retries
          return;
        }
        for (const { key, value } of rows) {
          await FacilitySettingMigration.upsert({
            id: carrierId(deviceId, key),
            key,
            value,
            deviceId,
          });
        }
      }
      await LocalSystemFact.set(FACT_SERVER_CONFIG_MIGRATED, toVersion);
    },
  },
];
