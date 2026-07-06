import config from 'config';

import { ReadSettings } from '../reader';

const configFacilityIds = () => {
  const { serverFacilityId, serverFacilityIds } = config as any;
  return serverFacilityId ? [serverFacilityId] : serverFacilityIds;
};

// The facility server resolves its facility ids at boot (env/facts/config), so it
// passes its own getter; reading it per request also picks up first-run setup
// completing without a restart. The central server uses the config default.
export const buildSettingsReaderMiddleware =
  (getFacilityIds: () => string[] | null | undefined = configFacilityIds) =>
  (req, _res, next) => {
    const { models } = req;
    try {
      const facilityIds = getFacilityIds();
      // n.b. facilityIds will not be defined if
      // - this is a central server; or
      // - this is a facility server that has not completed first-run setup
      // in which case only settings that are not facility specific will be available
      if (facilityIds?.length) {
        req.settings = facilityIds.reduce(
          (acc, facilityId) => ({
            ...acc,
            [facilityId]: new ReadSettings(models, facilityId),
          }),
          {},
        );
        // Server-wide reads (mirrors ApplicationContext's settings shape)
        req.settings.global = new ReadSettings(models);
      } else {
        req.settings = new ReadSettings(models);
      }
      next();
    } catch (e) {
      next(e);
    }
  };

export const settingsReaderMiddleware = buildSettingsReaderMiddleware();
