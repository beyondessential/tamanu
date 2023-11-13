import { ReadSettings } from '@tamanu/settings';
import config from 'config';

export async function buildSettingsReader(req, res, next) {
  try {
    const facilityId = config.serverFacilityId || null;
    req.settings = new ReadSettings(req.models, facilityId);
    next();
  } catch (e) {
    next(e);
  }
}
