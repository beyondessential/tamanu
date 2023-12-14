import { constants, promises as fs } from 'fs';
import config from 'config';
import { get, has, merge, pick, set, unset } from 'lodash';
import stripJsonComments from 'strip-json-comments';

import { facilityDefaults, centralDefaults, globalDefaults } from '@tamanu/settings';
import { SETTINGS_SCOPES, SETTING_KEYS } from '@tamanu/constants/settings';
import { buildSettingsRecords } from '../models/Setting';

const SETTINGS_PREDATING_MIGRATION = [
  `${SETTING_KEYS.VACCINATION_DEFAULTS}.departmentId`,
  `${SETTING_KEYS.VACCINATION_DEFAULTS}.locationId`,
  `${SETTING_KEYS.VACCINATION_GIVEN_ELSEWHERE_DEFAULTS}.departmentId`,
  `${SETTING_KEYS.VACCINATION_GIVEN_ELSEWHERE_DEFAULTS}.locationId`,
  'fhir.worker.heartbeat',
  'fhir.worker.assumeDroppedAfter',
  'integrations.imaging.enabled',
  'integrations.imaging.provider',
  'certifications.covidClearanceCertificate.after',
  'certifications.covidClearanceCertificate.daysSinceSampleTime',
  'certifications.covidClearanceCertificate.labTestCategories',
  'certifications.covidClearanceCertificate.labTestTypes',
  'certifications.covidClearanceCertificate.labTestResults',
  'syncAllLabRequests',
];

const SCOPED_DEFAULTS = {
  [SETTINGS_SCOPES.CENTRAL]: centralDefaults,
  [SETTINGS_SCOPES.FACILITY]: facilityDefaults,
  [SETTINGS_SCOPES.GLOBAL]: globalDefaults,
};

const SCOPED_KEY_TRANSFORM_MAPS = {
  [SETTINGS_SCOPES.CENTRAL]: {
    // Remove credentials inside nested keys of configs we want to keep
    'honeycomb.apiKey': null,
    'mailgun.apiKey': null,
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

const prepareReplacementsForInsert = (settings, serverFacilityId, scope) => {
  // Transform settings that need to be moved or deleted
  Object.entries(SCOPED_KEY_TRANSFORM_MAPS[scope]).forEach(([oldKey, newKey]) => {
    const exists = has(settings, oldKey);
    if (exists) {
      const value = get(settings, oldKey);
      if (value && newKey) set(settings, newKey, value);
      unset(settings, oldKey);
    }
  });
  // Remove top level keys not found in scoped defaults,
  // This also removes root keys not present in any scope eg: db & auth
  const validKeys = pick(settings, Object.keys(SCOPED_DEFAULTS[scope]));

  const settingRecords = buildSettingsRecords('', validKeys, serverFacilityId);
  // Map replacement to array of tuples for insert query
  return settingRecords.map(({ key, value, facilityId }) => [
    key,
    JSON.stringify(value),
    facilityId,
    scope,
  ]);
};

export async function up(query) {
  const { serverFacilityId = null } = config;

  // Tests seed settings after migrations
  // This is so we don't have to keep config/test.json around to seed settings
  // Test settings overrides are now defined in @tamanu/settings/test/{SETTINGS_SCOPE}
  if (process.env.NODE_ENV === 'test') return;

  // Merge env specific config -> local if exists
  const localConfig = await [`config/${process.env.NODE_ENV}.json`, 'config/local.json'].reduce(
    async (prevPromise, configPath) => {
      const prev = await prevPromise;
      try {
        await fs.access(configPath, constants.F_OK);
        return merge(
          prev,
          JSON.parse(stripJsonComments((await fs.readFile(configPath)).toString())),
        );
      } catch (err) {
        return prev;
      }
    },
    Promise.resolve({}),
  );

  const scopedSettingData = prepareReplacementsForInsert(
    localConfig,
    serverFacilityId,
    serverFacilityId ? SETTINGS_SCOPES.FACILITY : SETTINGS_SCOPES.CENTRAL,
  );

  if (scopedSettingData.length) {
    // Create the settings for either the facility or central scope
    await query.sequelize.query(
      `
        INSERT INTO settings (key, value, facility_id, scope)
        VALUES ${scopedSettingData.map(() => '(?)').join(', ')}
      `,
      {
        replacements: scopedSettingData,
      },
    );
  }

  if (serverFacilityId) return;

  // Central server only
  // Create the settings for global scope
  const globalSettingData = prepareReplacementsForInsert(localConfig, null, SETTINGS_SCOPES.GLOBAL);
  if (!globalSettingData.length) {
    return;
  }

  await query.sequelize.query(
    `
      INSERT INTO settings (key, value, facility_id, scope)
      VALUES ${globalSettingData.map(() => '(?)').join(', ')}
    `,
    {
      replacements: globalSettingData,
    },
  );
}

export async function down(query) {
  // Delete all settings except those that predate this migration
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
