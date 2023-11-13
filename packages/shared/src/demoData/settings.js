import config from 'config';
import { SETTINGS_SCOPES } from '@tamanu/constants';
import { facilityTestSettings, centralTestSettings, globalTestSettings } from '@tamanu/settings';

export async function seedSettings(models) {
  const { serverFacilityId } = config;
  const { Setting } = models;
  if (serverFacilityId) {
    await Setting.set('', facilityTestSettings, serverFacilityId, SETTINGS_SCOPES.FACILITY);
  } else {
    await Setting.set('', centralTestSettings, null, SETTINGS_SCOPES.CENTRAL);
  }
  await Setting.set('', globalTestSettings, null, SETTINGS_SCOPES.GLOBAL);
}
