import express from 'express';
import asyncHandler from 'express-async-handler';
import { NotFoundError } from 'shared/errors';

import { NOTE_OBJECT_TYPES } from 'shared/models/Note';

import { 
  simpleGet, 
  simplePut,
  simplePost,
  simpleGetList,
  permissionCheckingRouter,
} from './crudHelpers';

export const visit = express.Router();

visit.get('/:id', simpleGet('Visit'));
visit.put('/:id', simplePut('Visit'));
visit.post('/$', simplePost('Visit'));

visit.post(
  '/:id/notes',
  asyncHandler(async (req, res) => {
    const { models, body, params } = req;
    const { id } = params;
    req.checkPermission('write', 'Visit');
    const owner = await models.Visit.findByPk(id);
    if (!owner) {
      throw new NotFoundError();
    }
    req.checkPermission('write', owner);
    const createdNote = await models.Note.create({
      objectId: id,
      objectType: 'Visit',
      ...body,
    });

    res.send(createdNote);
  }),
);

const visitRelations = permissionCheckingRouter('read', 'Visit');
visitRelations.get('/:id/vitals', simpleGetList('Vitals', 'visitId'));
visitRelations.get('/:id/diagnoses', simpleGetList('VisitDiagnosis', 'visitId'));
visitRelations.get('/:id/notes', simpleGetList('Note', 'objectId', { additionalFilters: { objectType: NOTE_OBJECT_TYPES.VISIT } }));

visit.use(visitRelations);

