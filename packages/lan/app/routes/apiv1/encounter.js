import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import { NotFoundError } from 'shared/errors';
import { LAB_REQUEST_STATUSES, DOCUMENT_SIZE_LIMIT, INVOICE_STATUSES } from 'shared/constants';
import { NOTE_RECORD_TYPES } from 'shared/models/Note';
import { uploadAttachment } from '../../utils/uploadAttachment';

import {
  simpleGet,
  simpleGetHasOne,
  simplePost,
  simpleGetList,
  permissionCheckingRouter,
  runPaginatedQuery,
  paginatedGetList,
  createNoteListingHandler,
} from './crudHelpers';

export const encounter = express.Router();

encounter.get('/:id', simpleGet('Encounter'));
encounter.post('/$', simplePost('Encounter'));

encounter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { db, models, params } = req;
    const { referralId, id } = params;
    req.checkPermission('read', 'Encounter');
    const object = await models.Encounter.findByPk(id);
    if (!object) throw new NotFoundError();
    req.checkPermission('write', object);

    await db.transaction(async () => {
      if (req.body.discharge) {
        req.checkPermission('write', 'Discharge');
        await models.Discharge.create({
          ...req.body.discharge,
          encounterId: id,
        });

        // Update medications that were marked for discharge and ensure
        // only isDischarge, quantity and repeats fields are edited
        const medications = req.body.medications || {};
        for (const [medicationId, medicationValues] of Object.entries(medications)) {
          const { isDischarge, quantity, repeats } = medicationValues;
          if (isDischarge) {
            const medication = await models.EncounterMedication.findByPk(medicationId);
            await medication.update({ isDischarge, quantity, repeats });
          }
        }
      }

      if (referralId) {
        const referral = await models.Referral.findByPk(referralId);
        await referral.update({ encounterId: id });
      }
      await object.update(req.body);
    });

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
    const createdNote = await owner.createNote(body);

    res.send(createdNote);
  }),
);

encounter.post(
  '/:id/documentMetadata',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    // TODO: figure out permissions with Attachment and DocumentMetadata
    req.checkPermission('write', 'DocumentMetadata');

    // Make sure the specified encounter exists
    const specifiedEncounter = await models.Encounter.findByPk(params.id);
    if (!specifiedEncounter) {
      throw new NotFoundError();
    }

    // Create file on the sync server
    const { attachmentId, type, metadata } = await uploadAttachment(req, DOCUMENT_SIZE_LIMIT);

    const documentMetadataObject = await models.DocumentMetadata.create({
      ...metadata,
      attachmentId,
      type,
      encounterId: params.id,
    });

    res.send(documentMetadataObject);
  }),
);

const encounterRelations = permissionCheckingRouter('read', 'Encounter');
encounterRelations.get('/:id/discharge', simpleGetHasOne('Discharge', 'encounterId'));
encounterRelations.get('/:id/vitals', simpleGetList('Vitals', 'encounterId'));
encounterRelations.get('/:id/diagnoses', simpleGetList('EncounterDiagnosis', 'encounterId'));
encounterRelations.get('/:id/medications', simpleGetList('EncounterMedication', 'encounterId'));
encounterRelations.get('/:id/procedures', simpleGetList('Procedure', 'encounterId'));
encounterRelations.get(
  '/:id/labRequests',
  simpleGetList('LabRequest', 'encounterId', {
    additionalFilters: {
      status: {
        [Op.ne]: LAB_REQUEST_STATUSES.DELETED,
      },
    },
  }),
);
encounterRelations.get('/:id/referral', simpleGetList('Referral', 'encounterId'));
encounterRelations.get(
  '/:id/documentMetadata',
  paginatedGetList('DocumentMetadata', 'encounterId'),
);
encounterRelations.get('/:id/imagingRequests', simpleGetList('ImagingRequest', 'encounterId'));
encounterRelations.get('/:id/notes', createNoteListingHandler(NOTE_RECORD_TYPES.ENCOUNTER));
encounterRelations.get(
  '/:id/invoice',
  simpleGetHasOne('Invoice', 'encounterId', {
    additionalFilters: { status: { [Op.ne]: INVOICE_STATUSES.CANCELLED } },
  }),
);

encounterRelations.get(
  '/:id/programResponses',
  asyncHandler(async (req, res) => {
    const { db, models, params, query } = req;
    req.checkPermission('list', 'SurveyResponse');
    const encounterId = params.id;
    const { count, data } = await runPaginatedQuery(
      db,
      models.SurveyResponse,
      `
        SELECT COUNT(1) as count
        FROM
          survey_responses
          LEFT JOIN encounters
            ON (survey_responses.encounter_id = encounters.id)
          LEFT JOIN surveys
            ON (survey_responses.survey_id = surveys.id)
        WHERE
          survey_responses.encounter_id = :encounterId
        AND
          surveys.survey_type = 'programs'
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
        AND
          surveys.survey_type = 'programs'
      `,
      { encounterId },
      query,
    );

    res.send({
      count: parseInt(count, 10),
      data,
    });
  }),
);

encounter.use(encounterRelations);
