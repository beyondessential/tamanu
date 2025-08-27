import config from 'config';
import { log } from '@tamanu/shared/services/logging';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

export async function checkConfig({ settings, models }) {
  const ensureExists = async (modelName, code) => {
    const found = await models[modelName].findOne({ where: { code } });
    if (!found) {
      log.error(`Default survey ${modelName} with code ${code} could not be found`);
    }
  };
  const facilityIds = selectFacilityIds(config);
  for (const facilityId of facilityIds) {
    const { department, location } = await settings[facilityId].get('survey.defaultCodes');
    await Promise.all([ensureExists('Department', department), ensureExists('Location', location)]);
  }
}
