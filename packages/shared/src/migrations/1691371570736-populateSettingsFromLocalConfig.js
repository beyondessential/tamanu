import { access, readFile } from 'fs/promises';
import { constants } from 'fs';
import config from 'config';
import { defaultsDeep, get, has, isEmpty, pick, set, unset } from 'lodash';
import stripJsonComments from 'strip-json-comments';

import { SETTINGS_SCOPES, SETTING_KEYS } from '../constants';

import { facilityDefaults } from '../settings/facility';
import { centralDefaults } from '../settings/central';
import { globalDefaults } from '../settings/global';

const SETTINGS_PREDATING_MIGRATION = [
  SETTING_KEYS.VACCINATION_DEFAULTS,
  SETTING_KEYS.VACCINATION_GIVEN_ELSEWHERE_DEFAULTS,
  'fhir.worker.heartbeat',
  'fhir.worker.assumeDroppedAfter',
  'certifications.covidClearanceCertificate',
  'syncAllLabRequests',
  'integrations.imaging',
];

// Move some keys out of localisation into top level
const CENTRAL_KEY_TRANSFORM_MAP = {
  'localisation.labResultWidget': 'labResultWidget',
  'localisation.timeZone': 'timeZone',
  'localisation.data.imagingTypes': 'imagingTypes',
  'localisation.data.features': 'features',
};

const pickValidSettings = (settings, defaults) =>
  pick(
    settings,
    // Top level keys not defined in defaults are ignored as sensitive or require
    // restart to take effect
    Object.keys(defaults),
  );

export async function up(query) {
  const { serverFacilityId = null } = config;

  const scopedDefaults = serverFacilityId ? facilityDefaults : centralDefaults;
  const scope = serverFacilityId ? SETTINGS_SCOPES.FACILITY : SETTINGS_SCOPES.CENTRAL;

  const localConfig = await [('config/production.json', 'config/local.json')].reduce(
    async (acc, configPath) => {
      try {
        await access(configPath, constants.F_OK);
        const filesConfig = JSON.parse(stripJsonComments((await readFile(configPath)).toString()));
        return defaultsDeep(acc, filesConfig);
      } catch (err) {
        return acc;
      }
    },
    {},
  );

  if (isEmpty(localConfig)) {
    // eslint-disable-next-line no-console
    console.log('No local config found, skipping settings migration');
    return;
  }

  const scopedConfig = pickValidSettings(localConfig, scopedDefaults);
  await query.sequelize.models.Setting.set('', scopedConfig, serverFacilityId, scope);

  if (serverFacilityId) return;

  /* Central server only */

  // Transform some keys out of localisation into top level
  Object.entries(CENTRAL_KEY_TRANSFORM_MAP).forEach(([oldKey, newKey]) => {
    const value = has(localConfig, oldKey) && get(localConfig, oldKey);
    if (value) {
      set(localConfig, newKey, value);
      unset(localConfig, oldKey);
    }
  });

  const globalConfig = pickValidSettings(localConfig, globalDefaults);
  await query.sequelize.models.Setting.set('', globalConfig, null, SETTINGS_SCOPES.GLOBAL);
}

export async function down(query) {
  await query.sequelize.query(
    `
      DELETE FROM settings
      WHERE key NOT IN (:keys)
    `,
    {
      replacements: {
        keys: SETTINGS_PREDATING_MIGRATION,
      },
    },
  );
}
