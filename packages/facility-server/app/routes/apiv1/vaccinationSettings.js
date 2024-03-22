import express from 'express';
import asyncHandler from 'express-async-handler';
import config from 'config';
import { SETTINGS_SCOPES } from '@tamanu/constants';

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

    const defaults = await Setting.get(key, config.serverFacilityId, SETTINGS_SCOPES.FACILITY);

    res.send({ data: defaults || null });
  }),
);
