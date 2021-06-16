import express from 'express';
import asyncHandler from 'express-async-handler';

export const asset = express.Router();

asset.get(
  '/:name',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();

    const {
      models: { Asset },
      params: { name },
    } = req;

    const assetRecord = await Asset.findOne({
      where: {
        name,
      },
    });
    res.send(assetRecord);
  }),
);
