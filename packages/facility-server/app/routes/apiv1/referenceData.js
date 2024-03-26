import express from 'express';
import { simpleGet, simplePost, simplePut } from '@tamanu/shared/utils/crudHelpers';
import asyncHandler from 'express-async-handler';
import { REFERENCE_TYPES } from '@tamanu/constants';

export const referenceData = express.Router();

// Reference data relation endpoints
referenceData.get(
  '/addressHierarchyTypes',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();
    const {
      models: { ReferenceData },
      query: { baseLevel = REFERENCE_TYPES.VILLAGE },
    } = req;

    const entity = await ReferenceData.getNode({ where: { type: baseLevel }, raw: false });

    // The Assumption is that the address hierarchy tree is a "fully normalized tree" so that each layer
    // in the hierarchy is fully connected to the next layer across all nodes. There for the list of ancestor
    // types is the total list of types in the hierarchy.
    const ancestors = await entity.getAncestors();
    const hierarchy = ancestors.map(entity => entity.type).reverse();
    res.send(hierarchy);
  }),
);

referenceData.get(
  '/:id/ancestors',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();
    const {
      models: { ReferenceData },
      params: { id },
    } = req;

    const entity = await ReferenceData.findByPk(id);
    const ancestors = await entity.getAncestors();
    res.send(ancestors);
  }),
);

referenceData.get('/:id', simpleGet('ReferenceData'));
referenceData.put('/:id', simplePut('ReferenceData'));
referenceData.post('/$', simplePost('ReferenceData'));
