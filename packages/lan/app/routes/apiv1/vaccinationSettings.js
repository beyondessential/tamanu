import express from 'express';
import asyncHandler from 'express-async-handler';

export const vaccinationSettings = express.Router();

vaccinationSettings.get(
  '/:key',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();

    const {
      params: { key },
      settings,
    } = req;

    if (!key.startsWith('vaccinations.')) {
      throw new Error('Invalid vaccinations key');
    }

    const defaults = await settings.get(key);

    res.send({ data: defaults || null });
  }),
);
