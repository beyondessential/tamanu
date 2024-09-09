import { log } from '@tamanu/shared/services/logging';

export async function checkConfig({ settings, models }) {
  // check surveys
  const { department, location } = await settings.get('survey.defaultCodes');
  const ensureExists = async (modelName, code) => {
    const found = await models[modelName].findOne({ where: { code } });
    if (!found) {
      log.error(`Default survey ${modelName} with code ${code} could not be found`);
    }
  };
  await ensureExists('Department', department);
  await ensureExists('Location', location);
}
