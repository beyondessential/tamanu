import { FACT_FACILITY_CONFIG_MIGRATED, SETTINGS_SCOPES } from '@tamanu/constants';
import { CONFIG_TO_SETTINGS, configOverridesForScope } from '@tamanu/settings';
import { get as getAtPath } from 'es-toolkit/compat';

import type { Steps, StepArgs } from '../step.ts';
import { END } from '../step.js';

// Flat {key, value} for each facility-scoped config value present locally. Secrets and
// keys with no local config value are already dropped by configOverridesForScope.
export const facilityConfigRows = () => {
  const overrides = configOverridesForScope(SETTINGS_SCOPES.FACILITY);
  return CONFIG_TO_SETTINGS.filter(entry => entry.scope === SETTINGS_SCOPES.FACILITY)
    .map(entry => ({ key: entry.setting, value: getAtPath(overrides, entry.setting) }))
    .filter(row => row.value !== undefined);
};

// On the first facility upgrade, snapshot each facility-scoped config value into the
// FacilitySettingMigration carrier (one row per served facility) so it pushes up and
// central turns it into a facility Setting. Fact-gated to run once. The config fallback
// reader serves these values until the setting arrives, so timing isn't load-bearing.
export const STEPS: Steps = [
  {
    at: END,
    async check({ serverType, models: { LocalSystemFact } }: StepArgs) {
      return (
        serverType === 'facility' && !(await LocalSystemFact.get(FACT_FACILITY_CONFIG_MIGRATED))
      );
    },
    async run({
      toVersion,
      models: { FacilitySettingMigration, Facility, LocalSystemFact },
    }: StepArgs) {
      const rows = facilityConfigRows();
      if (rows.length) {
        const facilities = await Facility.findAll({ attributes: ['id'] });
        for (const { id: facilityId } of facilities) {
          for (const { key, value } of rows) {
            await FacilitySettingMigration.create({ key, value, facilityId });
          }
        }
      }
      await LocalSystemFact.set(FACT_FACILITY_CONFIG_MIGRATED, toVersion);
    },
  },
];
