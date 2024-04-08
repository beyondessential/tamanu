import config, { IConfig } from 'config';
import { ReadSettings } from '../reader';

export async function buildSettingsReader(req, _res, next) {
  try {
    const facilityId =
      (config as IConfig & { serverFacilityId: string | null }).serverFacilityId || null;
    req.settings = new ReadSettings(req.models, facilityId);
    next();
  } catch (e) {
    next(e);
  }
}
