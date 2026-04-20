import express from 'express';

import { simpleGet, simpleGetList, simplePut } from '@tamanu/shared/utils/crudHelpers';

/** `/admin/program` endpoint for CRUD-ing a single program */
export const programRouter = express.Router();

programRouter.get('/:id/surveys', simpleGetList('Survey', 'programId'));
programRouter.get('/:id', simpleGet('Program'));
programRouter.put('/:id', simplePut('Program'));

/** `/admin/programs` endpoint for collections of programs */
export const programsRouter = express.Router();

programsRouter.get('/', simpleGetList('Program'));
