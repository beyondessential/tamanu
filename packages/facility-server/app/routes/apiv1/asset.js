import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';

export const asset = express.Router();

asset.get(
  '/:name',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();

    const {
      models: { Asset },
      params: { name },
      query: { facilityId },
    } = req;

    const assetRecord = await Asset.findOne({
      where: {
        name,
        facilityId: { [Op.or]: [facilityId, null] },
      },
      order: [['facilityId', 'ASC NULLS LAST']],
    });

    res.send(assetRecord || {});
  }),
);
