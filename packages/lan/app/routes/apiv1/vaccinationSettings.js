import config from 'config';
import express from 'express';
import asyncHandler from 'express-async-handler';

export const vaccinationSettings = express.Router();

vaccinationSettings.get(
  '/:key',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();

    const {
      models: { Setting },
      params: { key },
    } = req;

    if (!key.startsWith('vaccinations.')) {
      throw new Error('Invalid vaccinations key');
    }

    const defaults = await Setting.get(key, config.serverFacilityId);

    res.send({ data: defaults || null });
  }),
);
