import { ReadSettings } from '../reader';

export const settingsReaderMiddleware = (req, _res, next) => {
  const { models, facilityId } = req;
  try {
    // n.b. facilityId will not be defined if
    // - this is a central server; or
    // - this is a route that is pre-auth
    // in which case only settings that are not facility specific will be available
    req.settings = new ReadSettings(models, facilityId);
    next();
  } catch (e) {
    next(e);
  }
};
