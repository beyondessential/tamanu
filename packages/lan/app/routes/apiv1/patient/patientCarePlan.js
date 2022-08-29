import express from 'express';
import asyncHandler from 'express-async-handler';
import { NOTE_TYPES } from 'shared/constants';
import { InvalidParameterError } from 'shared/errors';
import { NOTE_RECORD_TYPES } from 'shared/models/Note';

import { simpleGet, simplePut } from '../crudHelpers';
import { note } from '../note';

export const patientCarePlan = express.Router();

patientCarePlan.get('/:id', simpleGet('PatientCarePlan'));
patientCarePlan.put('/:id', simplePut('PatientCarePlan'));
patientCarePlan.post(
  '/$',
  asyncHandler(async (req, res) => {
    const {
      models: { PatientCarePlan },
    } = req;
    req.checkPermission('create', 'PatientCarePlan');
    if (!req.body.content) {
      throw new InvalidParameterError('Content is a required field');
    }
    const newCarePlan = await PatientCarePlan.create(req.body);
    await newCarePlan.createNote({
      date: req.body.date,
      content: req.body.content,
      type: NOTE_TYPES.TREATMENT_PLAN,
      authorId: req.user.id,
      onBehalfOfId: req.body.examinerId,
    });
    res.send(newCarePlan);
  }),
);

patientCarePlan.get(
  '/:id/notes',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    req.checkPermission('read', 'PatientCarePlan');

    const notes = await models.NotePage.findPagesWithSingleItem(models, {
      where: {
        recordId: params.id,
        recordType: NOTE_RECORD_TYPES.PATIENT_CARE_PLAN,
        noteType: NOTE_TYPES.TREATMENT_PLAN,
      },
      include: [
        { model: models.User, as: 'author' },
        { model: models.User, as: 'onBehalfOf' },
      ],
      // TODO add test to verify this order
      order: [['createdAt', 'ASC']],
    });
    res.send(notes);
  }),
);

patientCarePlan.post(
  '/:id/notes',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'PatientCarePlan');
    const newNote = await req.models.NotePage.create({
      recordId: req.params.id,
      recordType: NOTE_RECORD_TYPES.PATIENT_CARE_PLAN,
      date: req.body.date,
      type: NOTE_TYPES.TREATMENT_PLAN,
    });

    const newNoteItem = await req.models.NoteItem.create({
      notePageId: newNote.id,
      content: req.body.content,
      authorId: req.user.id,
    });
    res.send({ note: newNote, noteItem: newNoteItem });
  }),
);
