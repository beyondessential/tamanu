import express from 'express';
import asyncHandler from 'express-async-handler';
import { NotFoundError } from 'shared/errors';

import { NOTE_RECORD_TYPES } from 'shared/models/Note';

import {
  simpleGet,
  simplePut,
  simplePost,
  simpleGetList,
  permissionCheckingRouter,
} from './crudHelpers';

export const encounter = express.Router();

encounter.get('/:id', simpleGet('Encounter'));
encounter.put('/:id', simplePut('Encounter'));
encounter.post('/$', simplePost('Encounter'));

encounter.post(
  '/:id/notes',
  asyncHandler(async (req, res) => {
    const { models, body, params } = req;
    const { id } = params;
    req.checkPermission('write', 'Encounter');
    const owner = await models.Encounter.findByPk(id);
    if (!owner) {
      throw new NotFoundError();
    }
    req.checkPermission('write', owner);
    const createdNote = await models.Note.create({
      recordId: id,
      recordType: 'Encounter',
      ...body,
    });

    res.send(createdNote);
  }),
);

const encounterRelations = permissionCheckingRouter('read', 'Encounter');
encounterRelations.get('/:id/vitals', simpleGetList('Vitals', 'encounterId'));
encounterRelations.get('/:id/diagnoses', simpleGetList('EncounterDiagnosis', 'encounterId'));
encounterRelations.get('/:id/medications', simpleGetList('EncounterMedication', 'encounterId'));
encounterRelations.get('/:id/procedures', simpleGetList('Procedure', 'encounterId'));
encounterRelations.get('/:id/labRequests', simpleGetList('LabRequest', 'encounterId'));
encounterRelations.get(
  '/:id/notes',
  simpleGetList('Note', 'recordId', { additionalFilters: { recordType: NOTE_RECORD_TYPES.ENCOUNTER } }),
);

encounter.use(encounterRelations);
