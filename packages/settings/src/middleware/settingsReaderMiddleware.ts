import config from 'config';

import { ReadSettings } from '../reader';
import type { Models } from 'reader/readers/SettingsDBReader';

export const settingsReaderMiddleware = (req: { models: Models} & Record<string, unknown>, _res: unknown, next: Function) => {
  const { models } = req;
  const { serverFacilityId, serverFacilityIds } = config;
  const facilityIds = serverFacilityId ? [serverFacilityId] : serverFacilityIds? serverFacilityIds : [];
  const isFacility = facilityIds.length > 0;
  try {
    // n.b. facilityId will not be defined if
    // - this is a central server; or
    // - this is a route that is pre-auth
    // in which case only settings that are not facility specific will be available
    if (isFacility) {
      req.settings = Object.fromEntries(facilityIds.map(id => [id, new ReadSettings(models, id)]));
    } else {
      req.settings = new ReadSettings(models);
    }
    next();
  } catch (e) {
    next(e);
  }
};
