import express from 'express';
import asyncHandler from 'express-async-handler';
export const addressHierarchy = express.Router();

addressHierarchy.get(
  '/:type',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();

    const {
      models: { ReferenceData },
      params: { type = 'village' },
    } = req;

    const hierarchy = await ReferenceData.getAncestorByType(type);
    res.send(hierarchy);
  }),
);
