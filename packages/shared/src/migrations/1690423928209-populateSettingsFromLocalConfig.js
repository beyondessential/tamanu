import { readFile } from 'fs/promises';
import { Op } from 'sequelize';
import config from 'config';
import { pick } from 'lodash';
import stripJsonComments from 'strip-json-comments';
import { defaults } from '../settings/defaults';
import { buildSettingsRecords } from '../models/Setting';
import { SETTING_KEYS } from '../constants';

export async function up(query) {
  const { serverFacilityId } = config;
  const localConfig = pick(
    JSON.parse(stripJsonComments((await readFile('config/local.json')).toString())),
    // Top level keys not defined in defaults are ignored as sensitive or require
    // restart to take effect
    Object.keys(defaults),
  );

  const localSettings = buildSettingsRecords('', localConfig, serverFacilityId);

  await Promise.all(
    localSettings.map(({ key, value, facilityId }) =>
      query.sequelize.models.Setting.set(key, value, facilityId),
    ),
  );
}

export async function down(query) {
  // Should this be a soft delete
  await query.sequelize.models.Setting.destroy({
    where: {
      key: {
        // Existed before migration created
        [Op.notIn]: [
          SETTING_KEYS.VACCINATION_DEFAULTS,
          SETTING_KEYS.VACCINATION_GIVEN_ELSEWHERE_DEFAULTS,
          'fhir.worker.heartbeat',
          'certifications.covidClearanceCertificate',
          'syncAllLabRequests',
          'integrations.imaging',
        ],
      },
    },
  });
}
