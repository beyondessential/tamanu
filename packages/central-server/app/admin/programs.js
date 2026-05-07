import express from 'express';
import asyncHandler from 'express-async-handler';

import { simplePatch, findRouteObject, simpleGetList } from '@tamanu/shared/utils/crudHelpers';
import {
  programDefinitionSchema,
  sanitizeProgramDefinitionPreview,
  saveProgramDefinition,
} from './programImporter/programDefinition';

/** `/admin/program` endpoint for CRUD-ing a single program */
export const programRouter = express.Router();

programRouter.get('/:id/surveys', simpleGetList('Survey', 'programId'));
programRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const object = await findRouteObject(req, 'Program');
    /** Match behaviour of `./programExporter/exportProgram.js` */
    const programCode = object.id.replace(/^program-/, '');
    res.send({ ...object.toJSON(), programCode });
  }),
);
programRouter.patch('/:id', simplePatch('Program', { allowedFields: ['name'] }));
programRouter.post(
  '/:id/ai-form-builder-survey',
  asyncHandler(async (req, res) => {
    const program = await findRouteObject(req, 'Program');
    req.checkPermission('create', 'Survey');
    req.checkPermission('write', 'Survey');

    const programDefinition = await programDefinitionSchema.parseAsync(
      sanitizeProgramDefinitionPreview(await programDefinitionSchema.parseAsync(req.body.form)),
    );
    const surveys = await saveProgramDefinition({
      db: req.db,
      models: req.models,
      programId: program.id,
      programDefinition,
    });

    res.send({ surveys });
  }),
);

/** `/admin/programs` endpoint for collections of programs */
export const programsRouter = express.Router();

programsRouter.get('/', simpleGetList('Program'));
