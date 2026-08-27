import config from 'config';
import {
  FACT_MSUPPLY_INTEGRATION_SETTINGS_MIGRATED_CENTRAL,
  FACT_MSUPPLY_INTEGRATION_SETTINGS_MIGRATED_FACILITY,
  SETTINGS_SCOPES,
} from '@tamanu/constants';
import { ReadSettings } from '@tamanu/settings';

import type { Steps, StepArgs } from '../step.ts';
import { END } from '../step.js';
import { carrierId, servedFacilityIds } from './1785000000001-migrateFacilityConfigToSettings.js';

// Before this version, the mSupplyMed integration had a single `enabled` flag shared by
// both the medication-dispense push (mSupplyMedIntegrationProcessor) and the stock-on-hand
// pull (MSupplyStockOnHandProcessor). It has since split into two independent flags,
// medDispenseEnabled and stockOnHandEnabled, so each processor can be turned on
// independently. For a deployment that already configured the old flag, what actually
// determined whether a given processor did anything was `enabled` AND that processor's
// own schedule being enabled — so each new flag is derived from both.
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

// `Setting` is PULL_FROM_CENTRAL: central's own `settings` table is canonical, so if a
// deployment already went through the earlier config→settings migration
// (migrateFacilityConfigToSettings), the legacy `enabled` value is sitting there right now
// and central can derive + write the split settings itself, immediately — no dependency
// on any facility server being up or completing a sync round trip.
async function migrateFromCentralSettings({ toVersion, models }: StepArgs) {
  const { Facility, Setting, LocalSystemFact } = models;
  const facilities = await Facility.findAll({ attributes: ['id'] });

  for (const { id: facilityId } of facilities) {
    const legacyEnabled = await Setting.get(
      'integrations.mSupplyMed.enabled',
      facilityId,
      SETTINGS_SCOPES.FACILITY,
    );
    if (!legacyEnabled) continue;

    const medScheduleEnabled = await Setting.get(
      MED_DISPENSE_SCHEDULE_KEY,
      facilityId,
      SETTINGS_SCOPES.FACILITY,
    );
    const stockOnHandScheduleEnabled = await Setting.get(
      STOCK_ON_HAND_SCHEDULE_KEY,
      facilityId,
      SETTINGS_SCOPES.FACILITY,
    );

    for (const [key, value] of deriveSettings(
      legacyEnabled,
      medScheduleEnabled,
      stockOnHandScheduleEnabled,
    )) {
      // Both keys are new, so a row can only exist here from this same migration
      // re-running after a partial failure — re-deriving is safe and gives the same
      // result. Skip writing `false`: the schema default is already `false`, so an
      // explicit row is only needed when the derived value is `true`.
      if (!value) continue;
      await Setting.set(key, value, SETTINGS_SCOPES.FACILITY, facilityId);
    }
  }

  await LocalSystemFact.set(FACT_MSUPPLY_INTEGRATION_SETTINGS_MIGRATED_CENTRAL, toVersion);
}

// Fallback for a facility that hasn't gone through migrateFacilityConfigToSettings yet
// (e.g. a multi-version jump that skips straight past it): central has no visibility into
// that facility's local config, so the value can only be discovered by reading it there.
// The legacy `enabled` key was dropped from the schema, so the normal settings cascade
// (whose config lift only walks leaves present in the *current* schema) can no longer
// surface it — read the deployment's live config directly instead. Derived values are
// written via the FacilitySettingMigration carrier (a facility can't write its own
// facility-scoped Setting rows), so applying them still needs a sync round trip; this is
// the same latency migrateFacilityConfigToSettings itself accepts for the same reason.
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
      // Skip writing `false`: the schema default is already `false`, so a carrier row
      // is only needed when the derived value is `true`.
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
        serverType === 'central' &&
        !(await LocalSystemFact.get(FACT_MSUPPLY_INTEGRATION_SETTINGS_MIGRATED_CENTRAL))
      );
    },
    run: migrateFromCentralSettings,
  },
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
