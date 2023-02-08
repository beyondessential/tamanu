import express from 'express';
import asyncHandler from 'express-async-handler';

export const setting = express.Router();

setting.get(
  '/:key',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();

    const {
      models: { Setting },
      params: { key },
      query: { facilityId },
    } = req;

    const settingResult = await Setting.findOne({
      where: {
        key,
        facilityId,
      },
    });

    res.send({ data: settingResult?.value || '' });
  }),
);
