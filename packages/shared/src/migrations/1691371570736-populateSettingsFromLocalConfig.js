import { access, readFile } from 'fs/promises';
import { constants } from 'fs';
import config from 'config';
import { get, has, pick, set, unset } from 'lodash';
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

  let configPath;
  try {
    await access('config/test.json', constants.F_OK);
    console.log('test exists');
  } catch (error) {
    console.log(error);
  }
  try {
    await access('config/production.json', constants.F_OK);
    configPath = 'config/production.json';
  } catch (error) {
    console.log(error, 'No production config found, using local config', console.log(process.ENV));
    configPath = 'config/local.json';
  }

  const localData = JSON.parse(stripJsonComments((await readFile(configPath)).toString()));

  const scopedConfig = pickValidSettings(localData, scopedDefaults);
  await query.sequelize.models.Setting.set('', scopedConfig, serverFacilityId, scope);

  if (serverFacilityId) return;

  /* Central server only */

  // Transform some keys out of localisation into top level
  Object.entries(CENTRAL_KEY_TRANSFORM_MAP).forEach(([oldKey, newKey]) => {
    const value = has(localData, oldKey) && get(localData, oldKey);
    if (value) {
      set(localData, newKey, value);
      unset(localData, oldKey);
    }
  });

  const globalConfig = pickValidSettings(localData, globalDefaults);
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
