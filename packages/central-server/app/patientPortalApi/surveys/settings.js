import asyncHandler from 'express-async-handler';
import { ReadSettings } from '@tamanu/settings';

export const getSettings = asyncHandler(async (req, res) => {
  const { params } = req;
  const { models } = req.store;
  const { facilityId } = params;

  const settingsReader = new ReadSettings(models, facilityId);
  const settings = await settingsReader.getPatientPortalSettings();

  return res.send(settings);
});
