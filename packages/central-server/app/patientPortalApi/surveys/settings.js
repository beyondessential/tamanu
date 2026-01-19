import config from 'config';
import asyncHandler from 'express-async-handler';
import { ReadSettings } from '@tamanu/settings';

export const getSettings = asyncHandler(async (req, res) => {
  const {
    params: { facilityId },
    store: { models },
  } = req;

  const { countryTimeZone } = config;
  const settingsReader = new ReadSettings(models, {
    facilityId,
    countryTimeZone,
  });
  const settings = await settingsReader.getPatientPortalSettings();

  return res.send(settings);
});
