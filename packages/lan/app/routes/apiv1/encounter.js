import express from 'express';
import asyncHandler from 'express-async-handler';
import { NotFoundError } from 'shared/errors';

import { NOTE_RECORD_TYPES } from 'shared/models/Note';

import {
  simpleGet,
  simpleGetHasOne,
  simplePost,
  simpleGetList,
  permissionCheckingRouter,
  runPaginatedQuery,
} from './crudHelpers';

export const encounter = express.Router();

encounter.get('/:id', simpleGet('Encounter'));
encounter.post('/$', simplePost('Encounter'));

encounter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const { referralId, id } = params;
    req.checkPermission('read', 'Encounter');
    const object = await models.Encounter.findByPk(id);
    if (!object) throw new NotFoundError();
    req.checkPermission('write', object);

    if (req.body.discharge) {
      req.checkPermission('write', 'Discharge');
      await models.Discharge.create({
        ...req.body.discharge,
        encounterId: id,
      });
    }

    if (referralId) {
      const referral = await models.Referral.findByPk(referralId);
      referral.update({ encounterId: id });
    }
    await object.update(req.body);

    res.send(object);
  }),
);

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
encounterRelations.get('/:id/discharge', simpleGetHasOne('Discharge', 'encounterId'));
encounterRelations.get('/:id/vitals', simpleGetList('Vitals', 'encounterId'));
encounterRelations.get('/:id/diagnoses', simpleGetList('EncounterDiagnosis', 'encounterId'));
encounterRelations.get('/:id/medications', simpleGetList('EncounterMedication', 'encounterId'));
encounterRelations.get('/:id/procedures', simpleGetList('Procedure', 'encounterId'));
encounterRelations.get('/:id/labRequests', simpleGetList('LabRequest', 'encounterId'));
encounterRelations.get('/:id/referral', simpleGetList('Referral', 'encounterId'));
encounterRelations.get('/:id/imagingRequests', simpleGetList('ImagingRequest', 'encounterId'));
encounterRelations.get(
  '/:id/notes',
  simpleGetList('Note', 'recordId', {
    additionalFilters: { recordType: NOTE_RECORD_TYPES.ENCOUNTER },
  }),
);

encounterRelations.get(
  '/:id/surveyResponses',
  asyncHandler(async (req, res) => {
    const { db, models, params, query } = req;
    const encounterId = params.id;
    const result = await runPaginatedQuery(
      db,
      models.SurveyResponse,
      `
        SELECT COUNT(1) as count
        FROM
          survey_responses
          LEFT JOIN encounters
            ON (survey_responses.encounter_id = encounters.id)
        WHERE
          survey_responses.encounter_id = :encounterId
      `,
      `
        SELECT
          survey_responses.*,
          surveys.name as survey_name,
          programs.name as program_name,
          users.display_name as assessor_name
        FROM
          survey_responses
          LEFT JOIN surveys
            ON (survey_responses.survey_id = surveys.id)
          LEFT JOIN programs
            ON (programs.id = surveys.program_id)
          LEFT JOIN encounters
            ON (encounters.id = survey_responses.encounter_id)
          LEFT JOIN users
            ON (users.id = encounters.examiner_id)
        WHERE
          survey_responses.encounter_id = :encounterId
      `,
      { encounterId },
      query,
    );

    res.send(result);
  }),
);

encounter.use(encounterRelations);
