import express from 'express';
import asyncHandler from 'express-async-handler';

import {
  simpleGet,
  simplePut,
  simplePost,
  simpleGetList,
  permissionCheckingRouter,
} from './crudHelpers';

export const program = express.Router();

program.get('/:id', simpleGet('Program'));
program.put('/:id', simplePut('Program'));
program.post('/$', simplePost('Program'));

program.get(
  '/$',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Program');
    simpleGetList('Program')(req, res);
  }),
);

const programRelations = permissionCheckingRouter('read', 'Program');
programRelations.get('/:id/surveys', simpleGetList('Survey', 'programId'));
program.use(programRelations);
