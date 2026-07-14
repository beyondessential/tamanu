import config from 'config';
import {
  FACT_FACILITY_CONFIG_MIGRATED,
  FACT_FACILITY_IDS,
  SETTINGS_SCOPES,
} from '@tamanu/constants';
import { CONFIG_TO_SETTINGS, configOverridesForScope, settingPathOf } from '@tamanu/settings';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { get as getAtPath } from 'es-toolkit/compat';

import type { Steps, StepArgs } from '../step.ts';
import { END } from '../step.js';

// Deterministic id (same shape as patient_facilities' composite key) so every run
// produces identical rows — a random UUID pk would fail the migration-determinism
// check — and an interrupted run upserts rather than duplicating.
export const carrierId = (facilityId: string, key: string) =>
  `${facilityId.replaceAll(';', ':')};${key.replaceAll(';', ':')}`;

// Flat {key, value} for each facility-scoped config value present locally. Secrets and
// keys with no local config value are already dropped by configOverridesForScope.
export const facilityConfigRows = () => {
  const overrides = configOverridesForScope(SETTINGS_SCOPES.FACILITY);
  return CONFIG_TO_SETTINGS.filter(entry => entry.scope === SETTINGS_SCOPES.FACILITY)
    .map(entry => settingPathOf(entry))
    .map(key => ({ key, value: getAtPath(overrides, key) }))
    .filter(row => row.value !== undefined);
};

// The facilities this server serves (env > fact > config, mirroring serverConfig's
// resolution) — NOT Facility.findAll(): every facility in the deployment syncs down
// as reference data, and snapshotting config for facilities served by *other*
// servers would let whichever server syncs first stamp its values onto them.
export const servedFacilityIds = async (
  LocalSystemFact: StepArgs['models']['LocalSystemFact'],
): Promise<string[]> => {
  if (process.env.SYNC_FACILITY_IDS) {
    return [
      ...new Set(
        process.env.SYNC_FACILITY_IDS.split(',')
          .map(id => id.trim())
          .filter(Boolean),
      ),
    ];
  }
  const fact = await LocalSystemFact.get(FACT_FACILITY_IDS);
  if (fact) return JSON.parse(fact);
  return selectFacilityIds(config) ?? [];
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
      models: { FacilitySettingMigration, LocalSystemFact },
    }: StepArgs) {
      const rows = facilityConfigRows();
      if (rows.length) {
        const facilityIds = await servedFacilityIds(LocalSystemFact);
        for (const facilityId of facilityIds) {
          for (const { key, value } of rows) {
            await FacilitySettingMigration.upsert({
              id: carrierId(facilityId, key),
              key,
              value,
              facilityId,
            });
          }
        }
      }
      await LocalSystemFact.set(FACT_FACILITY_CONFIG_MIGRATED, toVersion);
    },
  },
];
