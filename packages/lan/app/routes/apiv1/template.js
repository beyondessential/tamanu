import express from 'express';
import asyncHandler from 'express-async-handler';

export const template = express.Router();

template.get(
  '/:key',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();

    const {
      params: { key },
      settings,
    } = req;

    if (!key.startsWith('localisation.templates.')) {
      throw new Error('Invalid template key');
    }

    const templateValue = await settings.get(key);

    res.send({ data: templateValue || null });
  }),
);
