import { access, readFile } from 'fs/promises';
import { constants } from 'fs';
import config from 'config';
import { get, has, isEmpty, merge, pick, set, unset } from 'lodash';
import stripJsonComments from 'strip-json-comments';

import { SETTINGS_SCOPES, SETTING_KEYS } from '@tamanu/constants/settings';

import { facilityDefaults } from '../settings/facility';
import { centralDefaults } from '../settings/central';
import { globalDefaults } from '../settings/global';

const APPLICABLE_CONFIG_FILES = ['config/production.json', 'config/local.json'];

const SETTINGS_PREDATING_MIGRATION = [
  SETTING_KEYS.VACCINATION_DEFAULTS,
  SETTING_KEYS.VACCINATION_GIVEN_ELSEWHERE_DEFAULTS,
  'fhir.worker.heartbeat',
  'fhir.worker.assumeDroppedAfter',
  'certifications.covidClearanceCertificate',
  'syncAllLabRequests',
  'integrations.imaging',
];

const SCOPED_KEY_TRANSFORM_MAPS = {
  [SETTINGS_SCOPES.CENTRAL]: {
    // Remove credentials inside nested keys of configs we want to keep
    'honeycomb.apiKey': null,
    'integrations.signer.keySecret': null,
    'integrations.omnilab.secret': null,
    'integrations.fijiVrs.username': null,
    'integrations.fijiVrs.password': null,
  },
  [SETTINGS_SCOPES.FACILITY]: {
    // Remove credentials inside nested keys of configs we want to keep
    'honeycomb.apiKey': null,
    'sync.email': null,
    'sync.password': null,
    'senaite.username': null,
    'senaite.password': null,
  },
  [SETTINGS_SCOPES.GLOBAL]: {
    // Move some keys out of localisation into top level and delete timeZone
    'localisation.labResultWidget': 'labResultWidget',
    'localisation.data.imagingTypes': 'imagingTypes',
    'localisation.data.features': 'features',
    'localisation.data.printMeasures': 'printMeasures',
    'localisation.data.country': 'country',
    // Replace timeZone in favor of countryTimeZone
    'localisation.timeZone': null,
    // Remove only other top level localisation key that is no longer needed
    'localisation.allowInvalid': null,
    // Move remaining keys to root of localisation
    'localisation.data': 'localisation',
  },
};

const transformKeys = (settings, transformMap, defaults) => {
  Object.entries(transformMap).forEach(([oldKey, newKey]) => {
    const value = has(settings, oldKey) && get(settings, oldKey);
    if (value) {
      if (newKey) set(settings, newKey, value);
      unset(settings, oldKey);
    }
  });
  // Remove top level keys not found in scoped defaults,
  // This also removes root keys not present in any scope like db, auth
  return pick(settings, Object.keys(defaults));
};

export async function up(query) {
  const { serverFacilityId = null } = config;

  const scopedDefaults = serverFacilityId ? facilityDefaults : centralDefaults;
  const scope = serverFacilityId ? SETTINGS_SCOPES.FACILITY : SETTINGS_SCOPES.CENTRAL;

  // Merge production -> local if exists
  const localConfig = await APPLICABLE_CONFIG_FILES.reduce(async (prevPromise, configPath) => {
    const prev = await prevPromise;
    try {
      await access(configPath, constants.F_OK);
      return merge(prev, JSON.parse(stripJsonComments((await readFile(configPath)).toString())));
    } catch (err) {
      return prev;
    }
  }, Promise.resolve({}));

  if (isEmpty(localConfig)) {
    // Skipping this migration if no relevant config is found
    // This is expected to happen in test contexts
    return;
  }

  const scopedSettings = transformKeys(
    localConfig,
    SCOPED_KEY_TRANSFORM_MAPS[scope],
    scopedDefaults,
  );
  // Set the settings for either the facility or central scope
  await query.sequelize.models.Setting.set('', scopedSettings, serverFacilityId, scope);

  if (serverFacilityId) return;

  /* Central server only */

  // Get existing keys from global scope
  const existingGlobalSettings = await query.sequelize.models.Setting.findAll({
    where: { scope: SETTINGS_SCOPES.GLOBAL },
  });

  const globalSettings = transformKeys(
    localConfig,
    SCOPED_KEY_TRANSFORM_MAPS[SETTINGS_SCOPES.GLOBAL],
    globalDefaults,
  );

  // Set the settings for the global scope
  await query.sequelize.models.Setting.set(
    '',
    merge(globalSettings, existingGlobalSettings),
    null,
    SETTINGS_SCOPES.GLOBAL,
  );
}

export async function down(query) {
  await query.sequelize.query(
    `
      DELETE FROM settings
      WHERE key ~* :keyRegex
    `,
    {
      replacements: {
        keyRegex: `^(?!${SETTINGS_PREDATING_MIGRATION.join('|')}).*$`,
      },
    },
  );
}
