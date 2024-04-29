import express from 'express';
import asyncHandler from 'express-async-handler';

export const settingTemplate = express.Router();

settingTemplate.get(
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

    const templateValue = await Setting.get(key, facilityId);

    res.send({ data: templateValue || null });
  }),
);
