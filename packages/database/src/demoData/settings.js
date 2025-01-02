import config from 'config';
import { SETTINGS_SCOPES } from '@tamanu/constants';
import { facilityTestSettings, centralTestSettings, globalTestSettings } from '@tamanu/settings';
import { defaultsDeep } from 'lodash';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

const seedForScope = async (models, settings, serverFacilityIds, scopeOverride) => {
  const { Setting } = models;
  const getScope = () => {
    if (scopeOverride) return scopeOverride;
    return serverFacilityIds ? SETTINGS_SCOPES.FACILITY : SETTINGS_SCOPES.GLOBAL;
  };
  const scope = getScope();
  const combineSettings = async (facilityId) => {
    const existing = await Setting.get('', facilityId, scope);
    const combined = defaultsDeep(existing, settings);
    return Setting.set('', combined, scope, facilityId);
  };
  if (serverFacilityIds) {
    return Promise.all(serverFacilityIds.map(combineSettings));
  }
  return combineSettings();
};

export async function seedSettings(models) {
  const serverFacilityIds = selectFacilityIds(config);

  await seedForScope(models, globalTestSettings);
  if (serverFacilityIds) {
    await seedForScope(models, facilityTestSettings, serverFacilityIds);
  } else {
    await seedForScope(models, centralTestSettings, null, SETTINGS_SCOPES.CENTRAL);
  }
}
