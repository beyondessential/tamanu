import { log } from '@tamanu/shared/services/logging';

export async function checkConfig(config, context) {
  // check surveys
  const { department, location } = await context.settings.get('survey.defaultCodes');
  const ensureExists = async (modelName, code) => {
    const found = await context.models[modelName].findOne({ where: { code } });
    if (!found) {
      log.error(`Default survey ${modelName} with code ${code} could not be found`);
    }
  };
  await ensureExists('Department', department);
  await ensureExists('Location', location);
}
