import { access, readFile } from 'fs/promises';
import { constants } from 'fs';
import config from 'config';
import { get, has, merge, pick, set, unset } from 'lodash';
import stripJsonComments from 'strip-json-comments';

import { SETTINGS_SCOPES, SETTING_KEYS } from '@tamanu/constants/settings';

import { facilityDefaults } from '../settings/facility';
import { centralDefaults } from '../settings/central';
import { globalDefaults } from '../settings/global';
import { buildSettingsRecords } from '../models/Setting';

const SETTINGS_PREDATING_MIGRATION = [
  SETTING_KEYS.VACCINATION_DEFAULTS,
  SETTING_KEYS.VACCINATION_GIVEN_ELSEWHERE_DEFAULTS,
  'fhir.worker.heartbeat',
  'fhir.worker.assumeDroppedAfter',
  'certifications.covidClearanceCertificate',
  'syncAllLabRequests',
  'integrations.imaging',
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
    const value = has(settings, oldKey) && get(settings, oldKey);
    if (value) {
      if (newKey) set(settings, newKey, value);
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

  // In the case of facility ci migration test run-through
  // we need to skip this migration as it predates seeding
  // of initial facility and will fail foreign key constraint
  if (process.env.NODE_ENV === 'test' && serverFacilityId) {
    const facility = await query.sequelize.query(
      `
        SELECT id
        FROM facilities
        WHERE id = :facilityId
      `,
      {
        replacements: {
          facilityId: serverFacilityId,
        },
        type: query.sequelize.QueryTypes.SELECT,
      },
    );
    if (!facility.length) return;
  }

  // Merge env specific config -> local if exists
  const localConfig = await [`config/${process.env.NODE_ENV}.json`, 'config/local.json'].reduce(
    async (prevPromise, configPath) => {
      const prev = await prevPromise;
      try {
        await access(configPath, constants.F_OK);
        return merge(prev, JSON.parse(stripJsonComments((await readFile(configPath)).toString())));
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

  if (serverFacilityId) return;

  // Central server only
  // Create the settings for global scope
  const globalSettingData = prepareReplacementsForInsert(localConfig, null, SETTINGS_SCOPES.GLOBAL);
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
      WHERE key ~* :keyRegex
    `,
    {
      replacements: {
        keyRegex: `^(?!${SETTINGS_PREDATING_MIGRATION.join('|').replace('.', '\\.')}).*$`,
      },
    },
  );
}
