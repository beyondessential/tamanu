import { merge } from 'es-toolkit/compat';
import { SETTINGS_SCOPES } from '@tamanu/constants';
import { configOverridesForScope, facilityDefaults } from '@tamanu/settings';

const fromConfigAndDefaults = () =>
  merge({}, facilityDefaults.sync, configOverridesForScope(SETTINGS_SCOPES.FACILITY).sync);

let resolved = fromConfigAndDefaults();

// Resolved once per process from the first facility, so a change applies on restart.
export async function initSyncSettings(primaryFacilitySettings) {
  resolved = primaryFacilitySettings
    ? await primaryFacilitySettings.get('sync')
    : fromConfigAndDefaults();
}

export const getSyncSettings = () => resolved;
