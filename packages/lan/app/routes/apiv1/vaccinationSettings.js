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
      query: { facilityId },
    } = req;

    if (!key.startsWith('vaccinations.')) {
      throw new Error('Invalid vaccinations key');
    }

    const defaults = await Setting.get(key, facilityId);

    res.send({ data: defaults || null });
  }),
);
