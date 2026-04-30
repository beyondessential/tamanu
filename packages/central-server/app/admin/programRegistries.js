import express from 'express';

import { simpleGet, simpleGetList, simplePatch } from '@tamanu/shared/utils/crudHelpers';

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

programRegistryRouter.get('/:id', simpleGet('ProgramRegistry'));
programRegistryRouter.patch(
  '/:id',
  simplePatch('ProgramRegistry', {
    allowedFields: ['code', 'currentlyAtType', 'name', 'visibilityStatus'],
  }),
);

/** `/admin/programRegistries` endpoint for collections of program registries */
export const programRegistriesRouter = express.Router();

programRegistriesRouter.get('/', simpleGetList('ProgramRegistry'));
