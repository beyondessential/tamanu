import config from 'config';
import { SETTINGS_SCOPES } from '@tamanu/constants';
import { facilityTestSettings, centralTestSettings, globalTestSettings } from '@tamanu/settings';

export async function seedSettings(models) {
  const { serverFacilityId } = config;
  const { Setting } = models;
  if (serverFacilityId) {
    await Setting.set('', facilityTestSettings, SETTINGS_SCOPES.FACILITY, serverFacilityId);
  } else {
    await Setting.set('', centralTestSettings, SETTINGS_SCOPES.CENTRAL);
  }
  await Setting.set('', globalTestSettings, SETTINGS_SCOPES.GLOBAL);
}
