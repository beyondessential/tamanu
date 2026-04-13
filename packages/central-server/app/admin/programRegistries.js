import express from 'express';
import asyncHandler from 'express-async-handler';

import { NotFoundError } from '@tamanu/errors';
import { simpleGetList, simplePut } from '@tamanu/shared/utils/crudHelpers';

const getProgramRegistryHandler = asyncHandler(async (req, res) => {
  req.checkPermission('read', 'ProgramRegistry');

  const { ProgramRegistry, Program } = req.models;
  const programRegistry = await ProgramRegistry.findByPk(req.params.id, {
    include: [
      {
        model: Program,
        as: 'program',
        attributes: ['id', 'name'],
      },
    ],
  });
  if (!programRegistry) throw new NotFoundError();

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
programRegistryRouter.put('/programRegistry/:id', simplePut('ProgramRegistry'));

/** `/admin/programRegistries` endpoint for collections of program registries */
export const programRegistriesRouter = express.Router();

programRegistriesRouter.get('/', simpleGetList('ProgramRegistry'));
