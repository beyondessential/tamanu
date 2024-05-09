import { ReadSettings } from '../reader';

export const buildSettingsReaderMiddleware = () =>
  function(req, _res, next) {
    try {
      req.settings = new ReadSettings(req.models, req.facilityId);
      next();
    } catch (e) {
      next(e);
    }
  };
