import asyncHandler from 'express-async-handler';
import { Op, QueryTypes, literal } from 'sequelize';
import { NotFoundError, InvalidParameterError, InvalidOperationError } from '@tamanu/shared/errors';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import config from 'config';
import { toCountryDateTimeString } from '@tamanu/shared/utils/countryDateTime';
import {
  LAB_REQUEST_STATUSES,
  DOCUMENT_SIZE_LIMIT,
  DOCUMENT_SOURCES,
  NOTE_RECORD_TYPES,
  VITALS_DATA_ELEMENT_IDS,
  CHARTING_DATA_ELEMENT_IDS,
  IMAGING_REQUEST_STATUS_TYPES,
  TASK_STATUSES,
  SURVEY_TYPES,
} from '@tamanu/constants';
import {
  simpleGet,
  simpleGetHasOne,
  simpleGetList,
  permissionCheckingRouter,
  runPaginatedQuery,
  paginatedGetList,
  softDeletionCheckingRouter,
} from '@tamanu/shared/utils/crudHelpers';
import { add } from 'date-fns';
import { z } from 'zod';

import { uploadAttachment } from '../../utils/uploadAttachment';
import { noteChangelogsHandler, noteListHandler } from '../../routeHandlers';
import { createPatientLetter } from '../../routeHandlers/createPatientLetter';

import { getLabRequestList } from '../../routeHandlers/labs';
import {
  deleteDocumentMetadata,
  deleteEncounter,
  deleteSurveyResponse,
} from '../../routeHandlers/deleteModel';
import { getPermittedSurveyIds } from '../../utils/getPermittedSurveyIds';

export const encounter = softDeletionCheckingRouter('Encounter');

encounter.get('/:id', simpleGet('Encounter', { auditAccess: true }));
encounter.post(
  '/$',
  asyncHandler(async (req, res) => {
    const { models, body, user } = req;
    req.checkPermission('create', 'Encounter');
    const encounterObject = await models.Encounter.create({ ...body, actorId: user.id });

    if (body.dietIds) {
      const dietIds = JSON.parse(body.dietIds);
      await encounterObject.addDiets(dietIds);
    }
    res.send(encounterObject);
  }),
);

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
      let systemNote;

      if (req.body.discharge) {
        req.checkPermission('write', 'Discharge');
        if (!req.body.discharge.dischargerId) {
          // Only automatic discharges can have a null discharger ID
          throw new InvalidParameterError('A discharge must have a discharger.');
        }
        const discharger = await models.User.findByPk(req.body.discharge.dischargerId);
        if (!discharger) {
          throw new InvalidParameterError(
            `Discharger with id ${req.body.discharge.dischargerId} not found.`,
          );
        }
        systemNote = `Patient discharged by ${discharger.displayName}.`;

        const medications = req.body.medications || {};
        for (const [medicationId, medicationValues] of Object.entries(medications)) {
          const { quantity, repeats } = medicationValues;
          const medication = await models.Prescription.findByPk(medicationId, {
            include: [
              {
                model: models.EncounterPrescription,
                as: 'encounterPrescription',
                attributes: ['encounterId'],
                required: false,
              },
              {
                model: models.PatientOngoingPrescription,
                as: 'patientOngoingPrescription',
                attributes: ['patientId'],
                required: false,
              },
            ],
          });

          if (!medication || medication.discontinued) continue;

          await medication.update({ quantity, repeats });
          await models.EncounterPrescription.update(
            { isSelectedForDischarge: true },
            { where: { encounterId: id, prescriptionId: medication.id } },
          );
          // If the medication is ongoing, we need to add it to the patient's ongoing medications
          if (medication.isOngoing && medication.encounterPrescription?.encounterId === id) {
            await models.PatientOngoingPrescription.create({
              patientId: encounterObject.patientId,
              prescriptionId: medication.id,
            });
          }
        }
      }

      if (referralId) {
        const referral = await models.Referral.findByPk(referralId, { paranoid: false });
        if (referral && referral.deletedAt)
          throw new InvalidOperationError('Cannot update a deleted referral.');
        await referral.update({ encounterId: id });
      }

      if (req.body.dietIds) {
        const dietIds = JSON.parse(req.body.dietIds);
        await encounterObject.setDiets(dietIds);
      }
      await encounterObject.update({ ...req.body, systemNote }, user);
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

    // Create file on the central server
    const { attachmentId, type, metadata } = await uploadAttachment(req, DOCUMENT_SIZE_LIMIT);

    const documentMetadataObject = await models.DocumentMetadata.create({
      ...metadata,
      attachmentId,
      type,
      encounterId: params.id,
      documentUploadedAt: getCurrentDateTimeString(),
      source: DOCUMENT_SOURCES.UPLOADED,
    });

    res.send(documentMetadataObject);
  }),
);

encounter.post('/:id/createPatientLetter', createPatientLetter('Encounter', 'encounterId'));

encounter.delete('/:id/documentMetadata/:documentMetadataId', deleteDocumentMetadata);

encounter.delete('/:id', deleteEncounter);

const encounterRelations = permissionCheckingRouter('read', 'Encounter');
encounterRelations.get(
  '/:id/discharge',
  asyncHandler(async (req, res) => {
    const {
      models: { Discharge },
      params,
    } = req;
    req.checkPermission('read', 'Discharge');

    const discharge = await Discharge.findOne({
      where: {
        encounterId: params.id,
      },
      include: Discharge.getFullReferenceAssociations(),
    });
    if (!discharge) throw new NotFoundError();
    await req.audit?.access?.({
      recordId: discharge.id,
      params,
      model: Discharge,
    });

    const plain = discharge.get({ plain: true });
    plain.address = await discharge.address();
    res.send(plain);
  }),
);
encounterRelations.get('/:id/legacyVitals', simpleGetList('Vitals', 'encounterId'));
encounterRelations.get('/:id/diagnoses', simpleGetList('EncounterDiagnosis', 'encounterId'));
encounterRelations.get(
  '/:id/medications',
  asyncHandler(async (req, res) => {
    const { models, params, query } = req;
    const { Prescription } = models;
    const { order = 'ASC', orderBy = 'medication.name', rowsPerPage, page, marDate } = query;

    req.checkPermission('list', 'Medication');

    const associations = Prescription.getListReferenceAssociations() || [];

    const medicationFilter = {};
    if (!req.ability.can('list', 'SensitiveMedication')) {
      medicationFilter['$medication.referenceDrug.is_sensitive$'] = false;
    }

    const baseQueryOptions = {
      where: medicationFilter,
      order: [
        [
          literal('CASE WHEN "discontinued" IS NULL OR "discontinued" = false THEN 1 ELSE 0 END'),
          'DESC',
        ],
        ...(orderBy ? [[...orderBy.split('.'), order.toUpperCase()]] : []),
        ['date', 'ASC'],
      ],

      include: [
        ...associations,
        {
          model: models.EncounterPrescription,
          as: 'encounterPrescription',
          include: {
            model: models.EncounterPausePrescription,
            as: 'pausePrescriptions',
            attributes: ['pauseDuration', 'pauseTimeUnit', 'pauseEndDate'],
            where: {
              pauseEndDate: {
                [Op.gt]: getCurrentDateTimeString(),
              },
            },
            required: false,
          },
          attributes: ['id', 'encounterId', 'isSelectedForDischarge'],
          where: {
            encounterId: params.id,
          },
        },
        {
          model: models.ReferenceData,
          as: 'medication',
          include: {
            model: models.ReferenceDrug,
            as: 'referenceDrug',
            attributes: ['referenceDataId', 'isSensitive']
          },
        },
      ],
    };

    // Add medicationAdministrationRecords with condition for same day
    if (marDate) {
      const startOfMarDate = `${marDate} 00:00:00`;
      const endOfMarDate = `${marDate} 23:59:59`;
      baseQueryOptions.include.push({
        model: models.MedicationAdministrationRecord,
        as: 'medicationAdministrationRecords',
        where: {
          dueAt: {
            [Op.gte]: startOfMarDate,
            [Op.lte]: endOfMarDate,
          },
        },
        include: [
          {
            association: 'reasonNotGiven',
            attributes: ['id', 'name', 'type'],
          },
          {
            association: 'recordedByUser',
            attributes: ['id', 'displayName'],
          },
        ],
        required: false,
      });

      baseQueryOptions.where = {
        ...baseQueryOptions.where,
        startDate: {
          [Op.lte]: endOfMarDate,
        },
        [Op.and]: [
          {
            [Op.or]: [
              { discontinuedDate: { [Op.is]: null } },
              { discontinuedDate: { [Op.gt]: startOfMarDate } },
            ],
          },
          {
            [Op.or]: [{ endDate: null }, { endDate: { [Op.gt]: startOfMarDate } }],
          },
        ],
      };
    }

    const count = await Prescription.count({
      ...baseQueryOptions,
      distinct: true,
    });

    const objects = await Prescription.findAll({
      ...baseQueryOptions,
      limit: rowsPerPage,
      offset: page && rowsPerPage ? page * rowsPerPage : undefined,
    });

    const data = objects.map((x) => x.forResponse());

    res.send({ count, data });
  }),
);

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
encounterRelations.get('/:id/triages', simpleGetList('Triage', 'encounterId'));
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
      includeNotes: includeNotesStr = 'true',
      status,
    } = query;
    const includeNote = includeNotesStr === 'true';

    req.checkPermission('list', 'ImagingRequest');

    const associations = ImagingRequest.getListReferenceAssociations() || [];

    const baseQueryOptions = {
      where: {
        encounterId,
        status: status || {
          [Op.notIn]: [
            IMAGING_REQUEST_STATUS_TYPES.DELETED,
            IMAGING_REQUEST_STATUS_TYPES.ENTERED_IN_ERROR,
          ],
        },
      },
      order: orderBy ? [[...orderBy.split('.'), order.toUpperCase()]] : undefined,
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
      objects.map(async (ir) => {
        return {
          ...ir.forResponse(),
          ...(includeNote ? await ir.extractNotes() : undefined),
          areas: ir.areas.map((a) => a.forResponse()),
          results: ir.results.map((result) => result.forResponse()),
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
    noteTypeCounts.forEach((n) => {
      noteTypeToCount[n.noteType] = n.count;
    });
    res.send({ data: noteTypeToCount });
  }),
);

encounterRelations.get(
  '/:id/notes/:noteId/changelogs',
  noteChangelogsHandler(NOTE_RECORD_TYPES.ENCOUNTER),
);

encounterRelations.get(
  '/:id/invoice',
  simpleGetHasOne('Invoice', 'encounterId', { auditAccess: true }),
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
    const surveyType = 'programs';
    const { order = 'asc', orderBy = 'endTime' } = query;
    const sortKey = PROGRAM_RESPONSE_SORT_KEYS[orderBy] || PROGRAM_RESPONSE_SORT_KEYS.endTime;
    const sortDirection = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const permittedSurveyIds = await getPermittedSurveyIds(req, models);

    if (!permittedSurveyIds.length) {
      res.send({
        data: [],
        count: 0,
      });
    }

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
          surveys.survey_type = :surveyType
        AND
          surveys.id IN (:surveyIds)
        AND
          encounters.deleted_at IS NULL
        AND
          survey_responses.deleted_at IS NULL
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
          surveys.survey_type = :surveyType
        AND
          surveys.id IN (:surveyIds)
        AND
          survey_responses.deleted_at IS NULL
        AND
          encounters.deleted_at is null
        ORDER BY ${sortKey} ${sortDirection}
      `,
      { encounterId, surveyType, surveyIds: permittedSurveyIds },
      query,
    );

    res.send({
      count: parseInt(count, 10),
      data,
    });
  }),
);

encounterRelations.delete('/:id/programResponses/:surveyResponseId', deleteSurveyResponse);

// Used in charts and vitals to query responses based on the date of a response answer
async function getAnswersWithHistory(req) {
  const { db, params, query } = req;
  const { id: encounterId, surveyId = null} = params;
  const { order = 'DESC', instanceId = null } = query;

  const isVitals = surveyId === null;
  const dateDataElement = isVitals
    ? VITALS_DATA_ELEMENT_IDS.dateRecorded
    : CHARTING_DATA_ELEMENT_IDS.dateRecorded;
  const historyTable = 'vital_logs'; // TODO: Create new model/table and use it here if its not vitals query
  // The LIMIT and OFFSET occur in an unusual place in this query
  // So we can't run it through the generic runPaginatedQuery function
  const countResult = await db.query(
    `
      SELECT COUNT(1) AS count
      FROM survey_response_answers
      INNER JOIN survey_responses response
      ON response.id = response_id
      WHERE data_element_id = :dateDataElement
      AND body IS NOT NULL
      AND response.encounter_id = :encounterId
      AND response.deleted_at IS NULL
      AND CASE WHEN :surveyId IS NOT NULL THEN response.survey_id = :surveyId ELSE true END
      AND CASE WHEN :instanceId IS NOT NULL THEN response.metadata->>'chartInstanceResponseId' = :instanceId ELSE true END
    `,
    {
      replacements: {
        encounterId,
        dateDataElement,
        surveyId,
        instanceId,
      },
      type: QueryTypes.SELECT,
    },
  );
  const { count } = countResult[0];
  if (count === 0) {
    return { data: [], count: 0 };
  }

  const { page = 0, rowsPerPage = 10 } = query;

  const result = await db.query(
    `
      WITH
      date AS (
        SELECT response_id, body
        FROM survey_response_answers
        INNER JOIN survey_responses response
        ON response.id = response_id
        WHERE data_element_id = :dateDataElement
        AND body IS NOT NULL
        AND response.encounter_id = :encounterId
        AND response.deleted_at IS NULL
        AND CASE WHEN :surveyId IS NOT NULL THEN response.survey_id = :surveyId ELSE true END
        AND CASE WHEN :instanceId IS NOT NULL THEN response.metadata->>'chartInstanceResponseId' = :instanceId ELSE true END
        ORDER BY body ${order} LIMIT :limit OFFSET :offset
      ),
      history AS (
        SELECT
          history_table.answer_id,
          ARRAY_AGG((
            JSONB_BUILD_OBJECT(
              'newValue', history_table.new_value,
              'reasonForChange', history_table.reason_for_change,
              'date', history_table.date,
              'userDisplayName', u.display_name
            )
          )) logs
        FROM survey_response_answers sra
          INNER JOIN survey_responses sr ON sr.id = sra.response_id
          LEFT JOIN ${historyTable} history_table ON history_table.answer_id = sra.id
          LEFT JOIN users u ON u.id = history_table.recorded_by_id
        WHERE sr.encounter_id = :encounterId
          AND sr.deleted_at IS NULL
        GROUP BY history_table.answer_id
      )

      SELECT
        JSONB_BUILD_OBJECT(
          'dataElementId', answer.data_element_id,
          'records', JSONB_OBJECT_AGG(date.body, JSONB_BUILD_OBJECT('id', answer.id, 'body', answer.body, 'logs', history.logs))
        ) result
      FROM
        survey_response_answers answer
      INNER JOIN
        date
      ON date.response_id = answer.response_id
      LEFT JOIN
        history
      ON history.answer_id = answer.id
      GROUP BY answer.data_element_id
    `,
    {
      replacements: {
        encounterId,
        limit: rowsPerPage,
        offset: page * rowsPerPage,
        dateDataElement,
        surveyId,
        instanceId,
      },
      type: QueryTypes.SELECT,
    },
  );

  const data = result.map((r) => r.result);
  return { count, data };
}

async function getGraphData(req, dateDataElementId) {
  const { models, params, query } = req;
  const { id: encounterId, dataElementId } = params;
  const { startDate, endDate } = query;
  const { SurveyResponse, SurveyResponseAnswer } = models;

  const dateAnswers = await SurveyResponseAnswer.findAll({
    include: [
      {
        model: SurveyResponse,
        required: true,
        as: 'surveyResponse',
        where: { encounterId },
      },
    ],
    where: {
      dataElementId: dateDataElementId,
      body: { [Op.gte]: startDate, [Op.lte]: endDate },
    },
  });

  const responseIds = dateAnswers.map((dateAnswer) => dateAnswer.responseId);

  const answers = await SurveyResponseAnswer.findAll({
    where: {
      responseId: responseIds,
      dataElementId,
      body: { [Op.and]: [{ [Op.ne]: '' }, { [Op.not]: null }] },
    },
  });

  const data = answers
    .map((answer) => {
      const { responseId } = answer;
      const recordedDateAnswer = dateAnswers.find(
        (dateAnswer) => dateAnswer.responseId === responseId,
      );
      const recordedDate = recordedDateAnswer.body;
      return { ...answer.dataValues, recordedDate };
    })
    .sort((a, b) => {
      return a.recordedDate > b.recordedDate ? 1 : -1;
    });
  return data;
}

encounterRelations.get(
  '/:id/vitals',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Vitals');
    const { count, data } = await getAnswersWithHistory(req);

    res.send({
      count: parseInt(count, 10),
      data,
    });
  }),
);

encounterRelations.get(
  '/:id/graphData/vitals/:dataElementId',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Vitals');
    const data = await getGraphData(req, VITALS_DATA_ELEMENT_IDS.dateRecorded);

    res.send({
      count: data.length,
      data,
    });
  }),
);

encounterRelations.get(
  '/:id/initialChart$',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Survey');
    const { models, params } = req;
    const { id: encounterId } = params;
    const chartSurvey = await models.SurveyResponse.findOne({
      attributes: ['survey.*'],
      where: { encounterId },
      include: [
        {
          attributes: ['id', 'name'],
          required: true,
          model: models.Survey,
          as: 'survey',
          where: { surveyType: [SURVEY_TYPES.SIMPLE_CHART, SURVEY_TYPES.COMPLEX_CHART] },
        },
      ],
      order: [['survey', 'name', 'ASC']],
      group: [['survey.id']],
    });

    res.send({
      data: chartSurvey,
    });
  }),
);

encounterRelations.get(
  '/:id/graphData/charts/:dataElementId',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Charting');
    const data = await getGraphData(req, CHARTING_DATA_ELEMENT_IDS.dateRecorded);

    res.send({
      count: data.length,
      data,
    });
  }),
);

encounterRelations.get(
  '/:id/charts/:surveyId',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'SurveyResponse');
    const { count, data } = await getAnswersWithHistory(req);

    res.send({
      count: parseInt(count, 10),
      data,
    });
  }),
);

const encounterTasksQuerySchema = z.object({
  order: z.preprocess(
    (value) => (typeof value === 'string' ? value.toUpperCase() : value),
    z.enum(['ASC', 'DESC']).optional().default('ASC'),
  ),
  orderBy: z.enum(['dueTime', 'name']).optional().default('dueTime'),
  statuses: z
    .array(z.enum(Object.values(TASK_STATUSES)))
    .optional()
    .default([TASK_STATUSES.TODO]),
  assignedTo: z.string().optional(),
  page: z.coerce.number().optional().default(0),
  rowsPerPage: z.coerce.number().optional().default(10),
});
encounterRelations.get(
  '/:id/tasks',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const { Task } = models;
    const { id: encounterId } = params;

    const query = await encounterTasksQuerySchema.parseAsync(req.query);
    const { order, orderBy, assignedTo, statuses, page, rowsPerPage } = query;

    req.checkPermission('list', 'Tasking');

    const upcomingTasksTimeFrame = config.tasking?.upcomingTasksTimeFrame || 8;
    const baseQueryOptions = {
      where: {
        encounterId,
        status: { [Op.in]: statuses },
        dueTime: {
          [Op.lte]: toCountryDateTimeString(add(new Date(), { hours: upcomingTasksTimeFrame })),
        },
        ...(assignedTo && {
          [Op.and]: literal(`
            EXISTS (
              SELECT 1 FROM "task_designations" AS td
              WHERE (
                "td"."designation_id" = :assignedTo
                AND "td"."task_id" = "Task"."id"
              )
            )
          `),
        }),
      },
      replacements: { assignedTo },
    };
    const queryResults = await Task.findAll({
      ...baseQueryOptions,
      order: [
        [orderBy, order.toUpperCase()],
        ['highPriority', 'DESC'],
        ['name', 'ASC'],
      ],
      limit: rowsPerPage,
      offset: page * rowsPerPage,
      include: [...Task.getFullReferenceAssociations(), 'parentTask'],
    });
    const results = queryResults.map((x) => x.forResponse());

    const count = await Task.count(baseQueryOptions);
    res.send({ data: results, count });
  }),
);

encounterRelations.get(
  '/:id/charts/:chartSurveyId/chartInstances',
  asyncHandler(async (req, res) => {
    const { db, params } = req;
    req.checkPermission('list', 'Charting');

    const { id: encounterId, chartSurveyId } = params;

    const results = await db.query(
      `
        WITH chart_instances AS (
          SELECT
            sr.id AS "chartInstanceId",
            sr.survey_id AS "chartSurveyId",
            MAX(CASE WHEN sra.data_element_id = :complexChartInstanceNameElementId THEN sra.body END) AS "chartInstanceName",
            MAX(CASE WHEN sra.data_element_id = :complexChartDateElementId THEN sra.body END) AS "chartDate",
            MAX(CASE WHEN sra.data_element_id = :complexChartTypeElementId THEN sra.body END) AS "chartType",
            MAX(CASE WHEN sra.data_element_id = :complexChartSubtypeElementId THEN sra.body END) AS "chartSubtype"
          FROM
            survey_responses sr
          LEFT JOIN
            survey_response_answers sra
          ON
            sr.id = sra.response_id
          WHERE
            sr.survey_id = :chartSurveyId AND
            sr.encounter_id = :encounterId AND
            sr.deleted_at IS NULL
          GROUP BY
            sr.id
        )

        SELECT
          *
        FROM chart_instances
        ORDER BY "chartDate" DESC;
      `,
      {
        replacements: {
          encounterId,
          chartSurveyId,
          complexChartInstanceNameElementId: CHARTING_DATA_ELEMENT_IDS.complexChartInstanceName,
          complexChartDateElementId: CHARTING_DATA_ELEMENT_IDS.complexChartDate,
          complexChartTypeElementId: CHARTING_DATA_ELEMENT_IDS.complexChartType,
          complexChartSubtypeElementId: CHARTING_DATA_ELEMENT_IDS.complexChartSubtype,
        },
        type: QueryTypes.SELECT,
      },
    );

    res.send({
      count: results.length,
      data: results,
    });
  }),
);

encounterRelations.delete(
  '/:id/chartInstances/:chartInstanceResponseId',
  asyncHandler(async (req, res) => {
    const { db, params, models } = req;
    req.checkPermission('delete', 'Charting');

    const { chartInstanceResponseId } = params;

    // all answers will also be soft deleted automatically
    await db.transaction(async () => {
      await models.SurveyResponse.destroy({ where: { id: chartInstanceResponseId } });

      await models.SurveyResponse.destroy({
        where: { 'metadata.chartInstanceResponseId': chartInstanceResponseId },
      });
    });

    res.send({});
  }),
);

encounter.use(encounterRelations);
