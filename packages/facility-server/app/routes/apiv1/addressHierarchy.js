import express from 'express';
import asyncHandler from 'express-async-handler';
import { REFERENCE_DATA_RELATION_TYPES } from '@tamanu/constants';
export const addressHierarchy = express.Router();

addressHierarchy.get(
  '/',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();

    const {
      models: { ReferenceData },
      params: { type = 'village' },
    } = req;

    const ancestors = await ReferenceData.getAncestorsOfType(type);
    const hierarchy = ancestors.reverse();
    res.send(hierarchy);
  }),
);
