import express from 'express';
import asyncHandler from 'express-async-handler';

import { findRouteObject, simpleGetList, simplePatch } from '@tamanu/shared/utils/crudHelpers';

const getProgramRegistryHandler = asyncHandler(async (req, res) => {
  const programRegistry = await findRouteObject(req, 'ProgramRegistry');
  res.send({
    ...programRegistry.forResponse(),
    program: programRegistry.program
      ? { id: programRegistry.program.id, name: programRegistry.program.name }
      : null,
  });
});

/** `/admin/programRegistry` endpoint when dealing with a single program registry */
export const programRegistryRouter = express.Router();

programRegistryRouter.get(
  '/:id/programRegistryClinicalStatuses',
  simpleGetList('ProgramRegistryClinicalStatus', 'programRegistryId'),
);

programRegistryRouter.get(
  '/:id/programRegistryConditions',
  simpleGetList('ProgramRegistryCondition', 'programRegistryId'),
);

programRegistryRouter.get(
  '/:id/programRegistryConditionCategories',
  simpleGetList('ProgramRegistryConditionCategory', 'programRegistryId'),
);

programRegistryRouter.get('/:id', getProgramRegistryHandler);
programRegistryRouter.patch(
  '/:id',
  simplePatch('ProgramRegistry', {
    allowedFields: ['code', 'currentlyAtType', 'name', 'visibilityStatus'],
  }),
);

/** `/admin/programRegistries` endpoint for collections of program registries */
export const programRegistriesRouter = express.Router();

programRegistriesRouter.get('/', simpleGetList('ProgramRegistry'));
