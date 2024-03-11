import express from 'express';
import { simpleGet, simplePost, simplePut } from '@tamanu/shared/utils/crudHelpers';
import asyncHandler from 'express-async-handler';
import { REFERENCE_TYPES, REFERENCE_DATA_RELATION_TYPES } from '@tamanu/constants';

export const referenceData = express.Router();

// Reference data relation endpoints
referenceData.get(
  '/addressHierarchyTypes',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();
    const {
      models: { ReferenceData },
      query: { bottomLevelType = REFERENCE_TYPES.VILLAGE },
    } = req;

    const entity = await ReferenceData.findOne({
      where: { type: bottomLevelType },
      include: {
        model: ReferenceData,
        as: 'parent',
        required: true,
        through: {
          attributes: [],
          where: {
            type: REFERENCE_DATA_RELATION_TYPES.ADDRESS_HIERARCHY,
          },
        },
      },
    });

    const ancestors = await entity.getAncestors();
    const hierarchy = ancestors.map(entity => entity.type).reverse();
    res.send(hierarchy);
  }),
);

referenceData.get(
  '/ancestors/:id',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();
    const {
      models: { ReferenceData },
      params: { id },
    } = req;

    const entity = await ReferenceData.findByPk(id);
    const ancestors = await entity.getAncestors();
    const hierarchy = ancestors.reverse();
    res.send(hierarchy);
  }),
);

referenceData.get('/:id', simpleGet('ReferenceData'));
referenceData.put('/:id', simplePut('ReferenceData'));
referenceData.post('/$', simplePost('ReferenceData'));
