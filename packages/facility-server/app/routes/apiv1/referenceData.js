import express from 'express';
import { simpleGet, simplePost, simplePut } from '@tamanu/shared/utils/crudHelpers';
import asyncHandler from 'express-async-handler';
import { REFERENCE_DATA_RELATION_TYPES, DEFAULT_HIERARCHY_TYPE, REFERENCE_TYPES } from '@tamanu/constants';
import { NotFoundError } from '@tamanu/errors';
import { keyBy, mapValues } from 'lodash';

export const referenceData = express.Router();

// Reference data relation endpoints
referenceData.get(
  '/addressHierarchyTypes',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();
    const {
      models: { ReferenceData },
      query: { leafNodeType, relationType = DEFAULT_HIERARCHY_TYPE },
    } = req;

    // Try to find a node for the requested leaf type; if not present, fall back to the
    // deepest available configured type so incomplete hierarchies still render correctly.
    const fallbackOrder = [
      leafNodeType,
      REFERENCE_TYPES.SETTLEMENT,
      REFERENCE_TYPES.SUBDIVISION,
      REFERENCE_TYPES.DIVISION,
    ];

    let entity = null;
    for (const candidateType of fallbackOrder) {
      if (!candidateType) continue;
      const found = await ReferenceData.getNode({
        where: { type: candidateType },
        raw: false,
        relationType,
      });
      if (found) {
        entity = found;
        break;
      }
    }

    if (!entity) {
      return res.send([]);
    }

    // The Assumption is that the address hierarchy tree is a "fully normalized tree" so that each layer
    // in the hierarchy is fully connected to the next layer across all nodes. There for the list of ancestor
    // types is the total list of types in the hierarchy.
    const ancestors = await entity.getAncestors(relationType);
    const hierarchyTypes = [...ancestors, entity.get({ plain: true })].map((e) => e.type);
    res.send(hierarchyTypes);
  }),
);

referenceData.get(
  '/:id/ancestors',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();
    const {
      models: { ReferenceData },
      params: { id },
      query: { relationType = DEFAULT_HIERARCHY_TYPE },
    } = req;

    const entity = await ReferenceData.findByPk(id);
    const ancestors = await entity.getAncestors(relationType);
    const hierarchyValues = [...ancestors, entity.get({ plain: true })];
    res.send(mapValues(keyBy(hierarchyValues, 'type'), 'id'));
  }),
);

referenceData.get(
  '/facilityCatchment/:id/facility',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();
    const {
      models: { ReferenceData, Facility },
      params: { id },
    } = req;
    const catchment = await ReferenceData.getParent(
      id,
      REFERENCE_DATA_RELATION_TYPES.FACILITY_CATCHMENT,
    );
    if (!catchment) throw new NotFoundError();
    const facility = await Facility.findOne({ where: { catchmentId: catchment.id } });
    if (!facility) throw new NotFoundError();
    res.send(facility);
  }),
);

referenceData.get('/:id', simpleGet('ReferenceData'));
referenceData.put('/:id', simplePut('ReferenceData'));
referenceData.post('/$', simplePost('ReferenceData'));
