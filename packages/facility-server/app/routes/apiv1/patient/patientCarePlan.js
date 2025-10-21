import express from 'express';
import asyncHandler from 'express-async-handler';
import {
  NOTE_RECORD_TYPES,
  NOTE_TYPES,
  REFERENCE_TYPES,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { InvalidParameterError } from '@tamanu/errors';

import { simpleGet, simplePut } from '@tamanu/shared/utils/crudHelpers';

export const patientCarePlan = express.Router();

patientCarePlan.get('/:id', simpleGet('PatientCarePlan'));
patientCarePlan.put('/:id', simplePut('PatientCarePlan'));
patientCarePlan.post(
  '/$',
  asyncHandler(async (req, res) => {
    const {
      models: { PatientCarePlan, ReferenceData },
    } = req;
    req.checkPermission('create', 'PatientCarePlan');
    if (!req.body.content) {
      throw new InvalidParameterError('Content is a required field');
    }
    const newCarePlan = await PatientCarePlan.create(req.body);

    const treatmentPlanNoteType = await ReferenceData.findOne({
      where: { type: REFERENCE_TYPES.NOTE_TYPE, code: NOTE_TYPES.TREATMENT_PLAN },
    });

    await newCarePlan.createNote({
      noteType: NOTE_TYPES.TREATMENT_PLAN,
      noteTypeId: treatmentPlanNoteType?.id,
      date: req.body.date,
      content: req.body.content,
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

    const notes = await models.Note.findAll({
      include: [
        { model: models.User, as: 'author' },
        { model: models.User, as: 'onBehalfOf' },
        { model: models.ReferenceData, as: 'noteTypeReference' },
      ],
      where: {
        recordId: params.id,
        recordType: NOTE_RECORD_TYPES.PATIENT_CARE_PLAN,
        '$noteTypeReference.code$': NOTE_TYPES.TREATMENT_PLAN,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      },
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

    const { models } = req;

    const treatmentPlanNoteType = await models.ReferenceData.findOne({
      where: { type: REFERENCE_TYPES.NOTE_TYPE, code: NOTE_TYPES.TREATMENT_PLAN },
    });

    const newNote = await models.Note.create({
      recordId: req.params.id,
      recordType: NOTE_RECORD_TYPES.PATIENT_CARE_PLAN,
      date: req.body.date,
      noteType: NOTE_TYPES.TREATMENT_PLAN,
      noteTypeId: treatmentPlanNoteType?.id,
      content: req.body.content,
      authorId: req.user.id,
      onBehalfOfId: req.body.onBehalfOfId,
    });

    res.send(newNote);
  }),
);
