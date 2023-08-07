import { readFile } from 'fs/promises';
import config from 'config';
import { defaultsDeep, pick, set, unset } from 'lodash';
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

const MOVE_FROM_LOCALISATION_TO_ROOT = [
  'labResultWidget',
  'timeZone',
  'data.imagingTypes',
  'data.features',
];

const getDefaultedSettings = (settings, defaults) =>
  defaultsDeep(
    pick(
      settings,
      // Top level keys not defined in defaults are ignored as sensitive or require
      // restart to take effect
      Object.keys(defaults),
    ),
    defaults,
  );

export async function up(query) {
  const { serverFacilityId = null } = config;

  const scopedDefaults = serverFacilityId ? facilityDefaults : centralDefaults;
  const scope = serverFacilityId ? SETTINGS_SCOPES.FACILITY : SETTINGS_SCOPES.CENTRAL;

  const localData = JSON.parse(stripJsonComments((await readFile('config/local.json')).toString()));

  if ('localisation' in localData && !serverFacilityId) {
    // Move some localisation keys to top level to match new defaults structure
    MOVE_FROM_LOCALISATION_TO_ROOT.forEach(key => {
      const value = localData[key];
      if (value) {
        set(localData, key, value);
        unset(localData, `localisation.${key}`);
      }
    });
  }

  const globalConfig = getDefaultedSettings(config, globalDefaults);
  const scopedConfig = getDefaultedSettings(config, scopedDefaults);

  await query.sequelize.models.Setting.set('', globalConfig, null, SETTINGS_SCOPES.GLOBAL);
  await query.sequelize.models.Setting.set('', scopedConfig, serverFacilityId, scope);
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
