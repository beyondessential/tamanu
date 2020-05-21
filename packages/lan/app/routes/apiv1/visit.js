import express from 'express';
import asyncHandler from 'express-async-handler';
import { NotFoundError } from 'shared/errors';

import { simpleGet, simplePut, simplePost, simpleGetList } from './crudHelpers';

export const visit = express.Router();

visit.get('/:id', simpleGet('Visit'));
visit.put('/:id', simplePut('Visit'));
visit.post('/$', simplePost('Visit'));

visit.get('/:id/vitals', simpleGetList('Vitals', 'visitId'));

visit.get('/:id/diagnoses', simpleGetList('VisitDiagnosis', 'visitId'));

visit.post('/:id/notes', asyncHandler(async (req, res) => {
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
    ...body
  });

  res.send(createdNote);
}));
