import { ReadSettings } from '@tamanu/settings';

export async function buildSettingsReader(req, res, next) {
  try {
    req.settings = new ReadSettings(req.models);
    next();
  } catch (e) {
    next(e);
  }
}
