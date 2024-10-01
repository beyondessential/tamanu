import { ReadSettings } from '../reader';

export const buildSettingsReaderMiddleware = (serverFacilityId = null) =>
  function(req, _res, next) {
    try {
      req.settings = new ReadSettings(req.models, serverFacilityId);
      next();
    } catch (e) {
      next(e);
    }
  };
