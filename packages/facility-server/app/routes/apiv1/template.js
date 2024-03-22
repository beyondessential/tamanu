import { SETTINGS_SCOPES } from '@tamanu/constants';
import express from 'express';
import asyncHandler from 'express-async-handler';

export const template = express.Router();

template.get(
  '/:key',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();

    const {
      models: { Setting },
      params: { key },
      query: { facilityId },
    } = req;

    if (!key.startsWith('templates.')) {
      throw new Error('Invalid template key');
    }

    const templateValue = await Setting.get(
      key,
      facilityId,
      facilityId ? SETTINGS_SCOPES.FACILITY : SETTINGS_SCOPES.GLOBAL,
    );

    res.send({ data: templateValue || null });
  }),
);
