import { log } from 'shared/services/logging';
import crypto from 'crypto';

export async function checkConfig(config, context) {

  // check surveys 
  const { department, location } = config.survey.defaultCodes;
  const ensureExists = async (modelName, code) => {
    const found = await context.models[modelName].findOne({ where: { code } });
    if (!found) {
      log.error(`Default survey ${modelName} with code ${code} could not be found`);
    }
  };
  await ensureExists('Department', department);
  await ensureExists('Location', location);

  // check ICAO key secret
  if (!config.icao.keySecret) {
    log.error('ICAO key secret is not set');
    const key = crypto.randomBytes(32).toString('base64');
    log.info(`Sample secret (random): '${key}'`);
  }
}
