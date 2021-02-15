import express from 'express';
import asyncHandler from 'express-async-handler';
import { NOTE_TYPES } from 'shared/constants';
import { NOTE_RECORD_TYPES } from 'shared/models/Note';

import { simpleGet, simplePut } from './crudHelpers';

export const patientCarePlan = express.Router();

patientCarePlan.get('/:id', simpleGet('PatientCarePlan'));
patientCarePlan.put('/:id', simplePut('PatientCarePlan'));
patientCarePlan.post(
  '/$',
  asyncHandler(async (req, res) => {
    const {
      models: { PatientCarePlan, Note },
    } = req;
    req.checkPermission('create', 'PatientCarePlan');
    if (!req.body.content) {
      res.status(400).send('Note is required for care plan');
      return;
    }
    const newCarePlan = await PatientCarePlan.create(req.body);
    await Note.create({
      recordId: newCarePlan.get('id'),
      recordType: NOTE_RECORD_TYPES.PATIENT_CARE_PLAN,
      date: req.body.date,
      content: req.body.content,
      noteType: NOTE_TYPES.TREATMENT_PLAN,
      authorId: req.user.id,
    });
    res.send(newCarePlan);
  }),
);

patientCarePlan.get(
  '/:id/notes',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    req.checkPermission('read', 'PatientCarePlan');

    const notes = await models.Note.findAll({
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

// TODO: onBehalfOf
patientCarePlan.post(
  '/:id/notes',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'PatientCarePlan');
    const newNote = await req.models.Note.create({
      recordId: req.params.id,
      recordType: NOTE_RECORD_TYPES.PATIENT_CARE_PLAN,
      date: req.body.date,
      content: req.body.content,
      noteType: NOTE_TYPES.TREATMENT_PLAN,
      authorId: req.user.id,
    });
    res.send(newNote);
  }),
);
