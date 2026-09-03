import config from 'config';
import { FACT_MSUPPLY_INTEGRATION_SETTINGS_MIGRATED_FACILITY, SETTINGS_SCOPES } from '@tamanu/constants';
import { ReadSettings } from '@tamanu/settings';

import type { Steps, StepArgs } from '../step.ts';
import { END } from '../step.js';
import { carrierId, servedFacilityIds } from './1785000000001-migrateFacilityConfigToSettings.js';

// The old shared `enabled` flag split into independent medDispenseEnabled/
// stockOnHandEnabled flags; each is derived as `enabled` AND that processor's own
// schedule, since that combination is what actually gated the processor before. Both
// processors run only on the facility server, which upgrades in lockstep with this
// migration, so deriving here (not also on central) is sufficient.
const MED_DISPENSE_SCHEDULE_KEY = 'schedules.mSupplyMedIntegrationProcessor.enabled';
const STOCK_ON_HAND_SCHEDULE_KEY = 'schedules.mSupplyStockOnHandProcessor.enabled';
const MED_DISPENSE_SETTING_KEY = 'integrations.mSupplyMed.medDispenseEnabled';
const STOCK_ON_HAND_SETTING_KEY = 'integrations.mSupplyMed.stockOnHandEnabled';

const deriveSettings = (
  legacyEnabled: unknown,
  medScheduleEnabled: unknown,
  stockOnHandScheduleEnabled: unknown,
): [string, boolean][] => [
  [MED_DISPENSE_SETTING_KEY, Boolean(legacyEnabled) && Boolean(medScheduleEnabled)],
  [STOCK_ON_HAND_SETTING_KEY, Boolean(legacyEnabled) && Boolean(stockOnHandScheduleEnabled)],
];

// The legacy key was dropped from the schema, so the settings cascade's config lift no
// longer surfaces it. Prefer an already-migrated Setting; fall back to live config only
// for a multi-version jump that reaches here before that sync has landed.
async function getLegacyMSupplyMedEnabled(
  models: StepArgs['models'],
  facilityId: string,
): Promise<boolean> {
  const dbValue = await models.Setting.get(
    'integrations.mSupplyMed.enabled',
    facilityId,
    SETTINGS_SCOPES.FACILITY,
  );
  if (dbValue !== undefined) return Boolean(dbValue);

  const configValue = (config as unknown as { integrations?: { mSupplyMed?: { enabled?: boolean } } })
    .integrations?.mSupplyMed?.enabled;
  return Boolean(configValue);
}

// A facility can't write its own facility-scoped Setting rows, so this goes through the
// FacilitySettingMigration carrier and needs a sync round trip to apply.
async function migrateFromFacilityConfig({ toVersion, log, models }: StepArgs) {
  const { Facility, FacilitySettingMigration, LocalSystemFact } = models;
  const facilityIds = await servedFacilityIds(LocalSystemFact);

  let complete = true;
  const existing = new Set(
    (await Facility.findAll({ attributes: ['id'], where: { id: facilityIds } })).map(
      (facility: { id: string }) => facility.id,
    ),
  );

  for (const facilityId of facilityIds) {
    if (!existing.has(facilityId)) {
      complete = false;
      log?.warn(
        'migrateMSupplyIntegrationEnabledSettings: facility not synced yet; retrying next upgrade',
        { facilityId },
      );
      continue;
    }

    const legacyEnabled = await getLegacyMSupplyMedEnabled(models, facilityId);
    if (!legacyEnabled) continue;

    const settings = new ReadSettings(models, facilityId);
    const medScheduleEnabled = await settings.get(MED_DISPENSE_SCHEDULE_KEY);
    const stockOnHandScheduleEnabled = await settings.get(STOCK_ON_HAND_SCHEDULE_KEY);

    for (const [key, value] of deriveSettings(
      legacyEnabled,
      medScheduleEnabled,
      stockOnHandScheduleEnabled,
    )) {
      // Schema default is already `false`, so only `true` needs a row.
      if (!value) continue;
      await FacilitySettingMigration.upsert({
        id: carrierId(facilityId, key),
        key,
        value,
        facilityId,
      });
    }
  }

  if (complete) {
    await LocalSystemFact.set(FACT_MSUPPLY_INTEGRATION_SETTINGS_MIGRATED_FACILITY, toVersion);
  }
}

export const STEPS: Steps = [
  {
    at: END,
    async check({ serverType, models: { LocalSystemFact } }: StepArgs) {
      return (
        serverType === 'facility' &&
        !(await LocalSystemFact.get(FACT_MSUPPLY_INTEGRATION_SETTINGS_MIGRATED_FACILITY))
      );
    },
    run: migrateFromFacilityConfig,
  },
];
