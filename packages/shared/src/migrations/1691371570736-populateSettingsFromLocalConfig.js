import { readFile } from 'fs/promises';
import config from 'config';
import { pick, set, unset } from 'lodash';
import stripJsonComments from 'strip-json-comments';

import { buildSettingsRecords } from '../models/Setting';
import { SETTING_KEYS } from '../constants';

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

const MIGRATE_FROM_LOCALISATION = [
  'labResultWidget',
  'timeZone',
  'data.imagingTypes',
  'data.features',
];

export async function up(query) {
  const { serverFacilityId } = config;

  const scopedDefaults = serverFacilityId ? facilityDefaults : centralDefaults;

  const localData = JSON.parse(stripJsonComments((await readFile('config/local.json')).toString()));

  if ('localisation' in localData && !serverFacilityId) {
    // Move some localisation keys to top level to match new defaults structure
    MIGRATE_FROM_LOCALISATION.forEach(key => {
      const value = localData[key];
      if (value) {
        set(localData, key, value);
        unset(localData, `localisation.${key}`);
      }
    });
  }

  const validKeys = Object.keys({ ...globalDefaults, ...scopedDefaults });

  const localConfig = pick(
    JSON.parse(stripJsonComments((await readFile('config/local.json')).toString())),
    // Top level keys not defined in defaults are ignored as sensitive or require
    // restart to take effect
    validKeys,
  );

  const localSettings = buildSettingsRecords('', localConfig, serverFacilityId);

  await Promise.all(
    localSettings.map(({ key, value, facilityId }) => {
      // Get scope
      return query.sequelize.models.Setting.set(key, value, facilityId);
    }),
  );
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
