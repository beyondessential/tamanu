import asyncHandler from 'express-async-handler';
import { ReadSettings } from '@tamanu/settings';
import { getPrimaryTimeZone } from '@tamanu/shared/utils/timeZoneCheck';

export const getSettings = asyncHandler(async (req, res) => {
  const {
    params: { facilityId },
    store: { models },
  } = req;

  const settingsReader = new ReadSettings(models, facilityId);
  const settings = await settingsReader.getPatientPortalSettings();

  return res.send(settings);
});

/** Dates and times patients enter are stored in the primary time zone, as staff's are. */
export const getTimeZone = asyncHandler(async (_req, res) => {
  res.send({ primaryTimeZone: getPrimaryTimeZone() });
});
