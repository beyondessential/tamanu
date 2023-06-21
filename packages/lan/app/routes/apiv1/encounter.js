import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op, QueryTypes } from 'sequelize';
import { NotFoundError, InvalidParameterError } from 'shared/errors';
import {
  LAB_REQUEST_STATUSES,
  DOCUMENT_SIZE_LIMIT,
  INVOICE_STATUSES,
  NOTE_RECORD_TYPES,
  VITALS_DATA_ELEMENT_IDS,
  IMAGING_REQUEST_STATUS_TYPES,
} from 'shared/constants';
import { uploadAttachment } from '../../utils/uploadAttachment';
import { noteListHandler } from '../../routeHandlers';

import {
  simpleGet,
  simpleGetHasOne,
  simplePost,
  simpleGetList,
  permissionCheckingRouter,
  runPaginatedQuery,
  paginatedGetList,
} from './crudHelpers';
import { getLabRequestList } from '../../routeHandlers/labs';

export const encounter = express.Router();

encounter.get('/:id', simpleGet('Encounter'));
encounter.post('/$', simplePost('Encounter'));

encounter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { db, models, user, params } = req;
    const { referralId, id } = params;
    req.checkPermission('read', 'Encounter');
    const encounterObject = await models.Encounter.findByPk(id);
    if (!encounterObject) throw new NotFoundError();
    req.checkPermission('write', encounterObject);

    await db.transaction(async () => {
      if (req.body.discharge) {
        req.checkPermission('write', 'Discharge');
        if (!req.body.discharge.dischargerId) {
          // Only automatic discharges can have a null discharger ID
          throw new InvalidParameterError('A discharge must have a discharger.');
        }

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
      await encounterObject.update(req.body, user);
    });

    res.send(encounterObject);
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
    const note = await owner.createNote(body);

    res.send(note);
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
encounterRelations.get('/:id/legacyVitals', simpleGetList('Vitals', 'encounterId'));
encounterRelations.get('/:id/diagnoses', simpleGetList('EncounterDiagnosis', 'encounterId'));
encounterRelations.get('/:id/medications', simpleGetList('EncounterMedication', 'encounterId'));
encounterRelations.get('/:id/procedures', simpleGetList('Procedure', 'encounterId'));
encounterRelations.get(
  '/:id/labRequests',
  getLabRequestList('encounterId', {
    additionalFilters: {
      status: {
        [Op.notIn]: [LAB_REQUEST_STATUSES.DELETED, LAB_REQUEST_STATUSES.ENTERED_IN_ERROR],
      },
    },
  }),
);
encounterRelations.get('/:id/referral', simpleGetList('Referral', 'encounterId'));
encounterRelations.get(
  '/:id/documentMetadata',
  paginatedGetList('DocumentMetadata', 'encounterId'),
);
encounterRelations.get(
  '/:id/imagingRequests',
  asyncHandler(async (req, res) => {
    const { models, params, query } = req;
    const { ImagingRequest } = models;
    const { id: encounterId } = params;
    const {
      order = 'ASC',
      orderBy = 'createdAt',
      rowsPerPage,
      page,
      includeNotes: includeNotesStr = 'false',
      status,
    } = query;
    const includeNote = includeNotesStr === 'true';

    req.checkPermission('list', 'ImagingRequest');

    const associations = ImagingRequest.getListReferenceAssociations(models) || [];

    const baseQueryOptions = {
      where: {
        encounterId,
        status: status || {
          [Op.and]: [
            { [Op.ne]: IMAGING_REQUEST_STATUS_TYPES.DELETED },
            { [Op.ne]: IMAGING_REQUEST_STATUS_TYPES.ENTERED_IN_ERROR },
          ],
        },
      },
      order: orderBy ? [[orderBy, order.toUpperCase()]] : undefined,
      include: associations,
    };

    const count = await ImagingRequest.count({
      ...baseQueryOptions,
    });

    const objects = await ImagingRequest.findAll({
      ...baseQueryOptions,
      limit: rowsPerPage,
      offset: page && rowsPerPage ? page * rowsPerPage : undefined,
    });

    const data = await Promise.all(
      objects.map(async ir => {
        return {
          ...ir.forResponse(),
          ...(includeNote ? await ir.extractNotes() : undefined),
          areas: ir.areas.map(a => a.forResponse()),
        };
      }),
    );

    res.send({ count, data });
  }),
);

encounterRelations.get('/:id/notes', noteListHandler(NOTE_RECORD_TYPES.ENCOUNTER));

encounterRelations.get(
  '/:id/notes/noteTypes',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const encounterId = params.id;
    const noteTypeCounts = await models.Note.count({
      group: ['noteType'],
      where: { recordId: encounterId, recordType: 'Encounter' },
    });
    const noteTypeToCount = {};
    noteTypeCounts.forEach(n => {
      noteTypeToCount[n.noteType] = n.count;
    });
    res.send({ data: noteTypeToCount });
  }),
);

encounterRelations.get(
  '/:id/invoice',
  simpleGetHasOne('Invoice', 'encounterId', {
    additionalFilters: { status: { [Op.ne]: INVOICE_STATUSES.CANCELLED } },
  }),
);

const PROGRAM_RESPONSE_SORT_KEYS = {
  endTime: 'end_time',
  submittedBy: 'submitted_by',
  programName: 'program_name',
  surveyName: 'survey_name',
  resultText: 'result_text',
};

encounterRelations.get(
  '/:id/programResponses',
  asyncHandler(async (req, res) => {
    const { db, models, params, query } = req;
    req.checkPermission('list', 'SurveyResponse');
    const encounterId = params.id;
    const { order = 'asc', orderBy = 'endTime' } = query;
    const sortKey = PROGRAM_RESPONSE_SORT_KEYS[orderBy] || PROGRAM_RESPONSE_SORT_KEYS.endTime;
    const sortDirection = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
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
          COALESCE(survey_user.display_name, encounter_user.display_name) as submitted_by
        FROM
          survey_responses
          LEFT JOIN surveys
            ON (survey_responses.survey_id = surveys.id)
          LEFT JOIN programs
            ON (programs.id = surveys.program_id)
          LEFT JOIN encounters
            ON (encounters.id = survey_responses.encounter_id)
          LEFT JOIN users encounter_user
            ON (encounter_user.id = encounters.examiner_id)
          LEFT JOIN users survey_user
            ON (survey_user.id = survey_responses.user_id)
        WHERE
          survey_responses.encounter_id = :encounterId
        AND
          surveys.survey_type = 'programs'
        ORDER BY ${sortKey} ${sortDirection}
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

encounterRelations.get(
  '/:id/vitals',
  asyncHandler(async (req, res) => {
    const { db, params, query } = req;
    req.checkPermission('list', 'Vitals');
    const encounterId = params.id;
    const { order = 'DESC' } = query;
    // The LIMIT and OFFSET occur in an unusual place in this query
    // So we can't run it through the generic runPaginatedQuery function
    const countResult = await db.query(
      `
        SELECT COUNT(1) AS count
        FROM
          survey_response_answers
        INNER JOIN
          survey_responses response
        ON
          response.id = response_id
        WHERE
          data_element_id = :dateDataElement
        AND
          body IS NOT NULL
        AND
          response.encounter_id = :encounterId
      `,
      {
        replacements: {
          encounterId,
          dateDataElement: VITALS_DATA_ELEMENT_IDS.dateRecorded,
        },
        type: QueryTypes.SELECT,
      },
    );
    const { count } = countResult[0];
    if (count === 0) {
      res.send({
        data: [],
        count: 0,
      });
      return;
    }

    const { page = 0, rowsPerPage = 10 } = query;

    const result = await db.query(
      `
        SELECT
          JSONB_BUILD_OBJECT(
            'dataElementId', answer.data_element_id,
            'records', JSONB_OBJECT_AGG(date.body, answer.body)) result
        FROM
          survey_response_answers answer
        INNER JOIN
          survey_screen_components ssc
        ON
          ssc.data_element_id = answer.data_element_id
        INNER JOIN
          (SELECT
            response_id, body
          FROM
            survey_response_answers
          INNER JOIN
            survey_responses response
          ON
            response.id = response_id
          WHERE
            data_element_id = :dateDataElement
          AND
            body IS NOT NULL
          AND
            response.encounter_id = :encounterId
            ORDER BY body ${order} LIMIT :limit OFFSET :offset) date
        ON date.response_id = answer.response_id
        GROUP BY answer.data_element_id
        `,
      {
        replacements: {
          encounterId,
          limit: rowsPerPage,
          offset: page * rowsPerPage,
          dateDataElement: VITALS_DATA_ELEMENT_IDS.dateRecorded,
        },
        type: QueryTypes.SELECT,
      },
    );

    const data = result.map(r => r.result);

    res.send({
      count: parseInt(count, 10),
      data,
    });
  }),
);

encounter.use(encounterRelations);
