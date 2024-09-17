import config from 'config';

import { ReadSettings } from '../reader';

/**
 * Copied from @tamanu/shared/src/utils/configSelectors.js
 * As we currently have build issues with shared package in settings
 */
const selectFacilityIds = config => {
  const { serverFacilityId, serverFacilityIds } = config;
  if (serverFacilityId && serverFacilityIds) {
    throw new Error(
      'Both serverFacilityId and serverFacilityIds are set in config, a facility server should either have a single facility or multiple facilities, not both.',
    );
  }
  return serverFacilityId ? [serverFacilityId] : serverFacilityIds;
};

export const settingsReaderMiddleware = (req, _res, next) => {
  const { models } = req;
  const facilityIds = selectFacilityIds(config);
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
