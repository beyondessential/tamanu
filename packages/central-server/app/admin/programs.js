import express from 'express';
import asyncHandler from 'express-async-handler';

import { simplePatch, findRouteObject, simpleGetList } from '@tamanu/shared/utils/crudHelpers';

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

/** `/admin/programs` endpoint for collections of programs */
export const programsRouter = express.Router();

programsRouter.get('/', simpleGetList('Program'));
