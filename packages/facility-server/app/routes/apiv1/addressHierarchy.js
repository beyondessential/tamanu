import express from 'express';
import asyncHandler from 'express-async-handler';
import { REFERENCE_TYPES } from '@tamanu/constants';
export const addressHierarchy = express.Router();

addressHierarchy.get(
  '/',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();

    const {
      models: { ReferenceData },
      query: { bottomLevelType = REFERENCE_TYPES.VILLAGE },
    } = req;

    const ancestors = await ReferenceData.getAncestorsOfType(bottomLevelType);
    const hierarchy = ancestors.reverse();
    res.send(hierarchy);
  }),
);
