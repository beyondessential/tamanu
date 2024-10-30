import config from 'config';

import { ReadSettings } from '../reader';

export const settingsReaderMiddleware = (req, _res, next) => {
  const { models } = req;
  const { serverFacilityId, serverFacilityIds } = config as any;
  const isFacility = serverFacilityId || serverFacilityIds;
  const facilityIds = isFacility && (serverFacilityId ? [serverFacilityId] : serverFacilityIds);
  try {
    // n.b. facilityId will not be defined if
    // - this is a central server; or
    // - this is a route that is pre-auth
    // in which case only settings that are not facility specific will be available
    if (facilityIds) {
      req.settings = facilityIds.reduce(
        (acc, facilityId) => ({
          ...acc,
          [facilityId]: new ReadSettings(models, facilityId),
        }),
        {},
      );
    } else {
      req.settings = new ReadSettings(models);
    }
    next();
  } catch (e) {
    next(e);
  }
};
