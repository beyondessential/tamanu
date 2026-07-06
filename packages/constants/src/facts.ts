//! Keys for use in the LocalSystemFact table

import {
  MATERIALIZED_VIEW_LAST_REFRESHED_AT_KEY_NAMESPACE,
  MATERIALIZED_VIEWS,
} from './materializedView.js';

export const FACT_TIME_OFFSET = 'timeOffset';

// Internal sync facts
export const FACT_CURRENT_SYNC_TICK = 'currentSyncTick';
export const FACT_LAST_SUCCESSFUL_SYNC_PULL = 'lastSuccessfulSyncPull';
export const FACT_LAST_SUCCESSFUL_SYNC_PUSH = 'lastSuccessfulSyncPush';
export const FACT_LOOKUP_UP_TO_TICK = 'lastSuccessfulLookupTableUpdate';
export const FACT_SYNC_TRIGGER_CONTROL = 'syncTrigger';
export const FACT_LOOKUP_MODELS_TO_REBUILD = 'lookupModelsToRebuild';

// Device identity facts
export const FACT_CENTRAL_HOST = 'syncHost';
export const FACT_SYNC_EMAIL = 'syncEmail';
export const FACT_SYNC_PASSWORD = 'syncPassword';
export const FACT_CURRENT_VERSION = 'currentVersion';
export const FACT_DEVICE_ID = 'deviceId';
export const FACT_DEVICE_KEY = 'deviceKey';
export const FACT_FACILITY_IDS = 'facilityIds';
export const FACT_META_SERVER_ID = 'metaServerId';

// Set once the central server has seeded settings from its legacy config, so the
// one-off migration doesn't re-run and resurrect a setting an operator has deleted.
export const FACT_CENTRAL_CONFIG_MIGRATED = 'centralConfigMigratedToSettings';

// Set once a facility server has snapshotted its facility-scoped config into the
// FacilitySettingMigration carrier to push up to central, so it runs only once.
export const FACT_FACILITY_CONFIG_MIGRATED = 'facilityConfigMigratedToSettings';

// mSupply integration
export const FACT_MSUPPLY_MED_INTEGRATION_ENABLED_AT = 'mSupplyMedIntegrationEnabledAt';

// Random per-server secret the reporting/raw role passwords are derived from.
export const FACT_REPORTING_ROLE_SECRET = 'reportingRoleSecret';
// When that secret was last (re)generated, for automatic age-based rotation.
export const FACT_REPORTING_SECRET_ROTATED_AT = 'reportingSecretRotatedAt';

// Materialised views
export const FACT_MV_UPCOMING_VACCINATIONS = `${MATERIALIZED_VIEW_LAST_REFRESHED_AT_KEY_NAMESPACE}:${MATERIALIZED_VIEWS.UPCOMING_VACCINATIONS}`;
