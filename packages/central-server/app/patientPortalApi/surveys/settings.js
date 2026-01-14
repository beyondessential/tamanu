import asyncHandler from 'express-async-handler';
import { ReadSettings } from '@tamanu/settings';
import config from 'config';

export const getSettings = asyncHandler(async (req, res) => {
  const {
    params: { facilityId },
    store: { models },
  } = req;

  const settingsReader = new ReadSettings(models, {
    facilityId,
    countryTimeZone: config.countryTimeZone,
  });
  const settings = await settingsReader.getPatientPortalSettings();

  return res.send(settings);
});
