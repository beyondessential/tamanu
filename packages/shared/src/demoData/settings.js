import config from 'config';
import { SETTINGS_SCOPES } from '@tamanu/constants';
import { facilityTestSettings, centralTestSettings, globalTestSettings } from '@tamanu/settings';
import { defaultsDeep } from 'lodash';

const seedForScope = async (models, settings, serverFacilityId, scopeOverride) => {
  const { Setting } = models;
  const getScope = () => {
    if (scopeOverride) return scopeOverride;
    return serverFacilityId ? SETTINGS_SCOPES.FACILITY : SETTINGS_SCOPES.GLOBAL;
  };
  const scope = getScope();
  const existing = await Setting.get('', serverFacilityId, scope);
  const combined = defaultsDeep(existing, settings);
  return Setting.set('', combined, scope, serverFacilityId);
};

export async function seedSettings(models) {
  const { serverFacilityId } = config;

  await seedForScope(models, globalTestSettings);
  if (serverFacilityId) {
    await seedForScope(models, facilityTestSettings, serverFacilityId);
  } else {
    await seedForScope(models, centralTestSettings, null, SETTINGS_SCOPES.CENTRAL);
  }
}
