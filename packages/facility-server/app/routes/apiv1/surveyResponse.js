import { subject } from '@casl/ability';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { isEqual, isObject } from 'lodash';
import { QueryTypes } from 'sequelize';

import {
  PATIENT_DATA_FIELD_LOCATIONS,
  PROGRAM_DATA_ELEMENT_TYPES,
  SURVEY_TYPES,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { InvalidOperationError, InvalidParameterError, NotFoundError } from '@tamanu/errors';
import {
  getPatientDataFieldAssociationData,
  transformAnswers,
} from '@tamanu/shared/reports/utilities/transformAnswers';
import { runCalculations } from '@tamanu/shared/utils/calculations';
import {
  getActiveActionComponents,
  getResultValue,
  getStringValue,
} from '@tamanu/shared/utils/fields';
import { getPatientDataDbLocation } from '@tamanu/shared/utils/getPatientDataDbLocation';
import { safeJsonParse } from '@tamanu/utils/safeJsonParse';

export const surveyResponse = express.Router();

async function getBodyForAnswer(dataElementType, value, models) {
  if (dataElementType === PROGRAM_DATA_ELEMENT_TYPES.PHOTO && value) {
    // If the client already provided an attachment id, keep it as-is
    if (typeof value === 'string') return value;

    const { size, data } = value;
    const { id: attachmentId } = await models.Attachment.create(
      models.Attachment.sanitizeForDatabase({
        type: 'image/jpeg',
        size,
        data,
      }),
    );
    return attachmentId;
  }

  return getStringValue(dataElementType, value);
}

async function createPatientIssues(models, questions, patientId) {
  const issueQuestions = questions.filter(
    q => q.dataElement.type === PROGRAM_DATA_ELEMENT_TYPES.PATIENT_ISSUE,
  );
  for (const question of issueQuestions) {
    const config = safeJsonParse(question.config) ?? {};
    if (!config.issueNote || !config.issueType) {
      throw new InvalidOperationError(
        `Ill-configured PatientIssue with config: ${question.config}`,
      );
    }
    await models.PatientIssue.create({
      patientId,
      type: config.issueType,
      note: config.issueNote,
    });
  }
}

const getFieldsToWrite = async (models, questions, answers) => {
  const recordValuesByModel = {};
  const patientDataQuestions = questions.filter(
    q => q.dataElement.type === PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA,
  );
  for (const question of patientDataQuestions) {
    const { dataElement, config: configString } = question;
    const config = safeJsonParse(configString) ?? {};
    if (!config.writeToPatient) continue;

    const configFieldName = config.writeToPatient?.fieldName;
    if (!configFieldName) throw new Error('No fieldName defined for writeToPatient config');

    const value = answers[dataElement.id];
    const { modelName, fieldName } = await getPatientDataDbLocation(configFieldName, models);
    if (!modelName) throw new Error(`Unknown fieldName: ${configFieldName}`);
    recordValuesByModel[modelName] ??= {};
    recordValuesByModel[modelName][fieldName] = value;
  }
  return recordValuesByModel;
};

async function writeToPatientFields(
  models,
  facilityId,
  questions,
  answers,
  patientId,
  surveyId,
  userId,
  submittedTime,
) {
  const valuesByModel = await getFieldsToWrite(models, questions, answers);

  if (valuesByModel.Patient) {
    const patient = await models.Patient.findByPk(patientId);
    await patient?.update(valuesByModel.Patient);
  }

  if (valuesByModel.PatientFieldValue) {
    const patient = await models.Patient.findByPk(patientId);
    await patient?.writeFieldValues(valuesByModel.PatientFieldValue);
  }

  if (valuesByModel.PatientAdditionalData) {
    const pad = await models.PatientAdditionalData.getOrCreateForPatient(patientId);
    await pad.update(valuesByModel.PatientAdditionalData);
  }

  if (valuesByModel.PatientProgramRegistration) {
    const survey = await models.Survey.findByPk(surveyId);
    const programRegistryDetail = await models.ProgramRegistry.findOne({
      where: { programId: survey?.programId, visibilityStatus: VISIBILITY_STATUSES.CURRENT },
    });
    if (!programRegistryDetail?.id) {
      throw new Error('No program registry configured for the current form');
    }

    const existingRegistration = await models.PatientProgramRegistration.findOne({
      where: {
        patientId,
        programRegistryId: programRegistryDetail.id,
      },
    });

    const registrationData = {
      patientId,
      programRegistryId: programRegistryDetail.id,
      ...valuesByModel.PatientProgramRegistration,
      registeringFacilityId:
        valuesByModel.PatientProgramRegistration.registeringFacilityId || facilityId,
      clinicianId: valuesByModel.PatientProgramRegistration.clinicianId || userId,
    };

    if (existingRegistration) {
      await existingRegistration.update(registrationData);
    } else {
      await models.PatientProgramRegistration.create({
        date: submittedTime,
        ...registrationData,
      });
    }
  }
}

async function handleSurveyResponseActions(
  models,
  facilityId,
  questions,
  answers,
  patientId,
  surveyId,
  userId,
  submittedTime,
) {
  const activeQuestions = getActiveActionComponents(questions, answers);
  await createPatientIssues(models, activeQuestions, patientId);
  await writeToPatientFields(
    models,
    facilityId,
    activeQuestions,
    answers,
    patientId,
    surveyId,
    userId,
    submittedTime,
  );
}

/**
 * @param {Record<string, unknown> | null} prev
 * @param {Record<string, unknown> | null} curr
 */
function diffKeys(prev, curr) {
  if (!curr) return [];
  const keys = new Set(prev ? Object.keys(prev).concat(Object.keys(curr)) : Object.keys(curr));

  /** @type {{ fieldKey: string; from: any; to: any; }[]} */
  const out = [];
  for (const k of keys) {
    const a = prev ? prev[k] : undefined;
    const b = curr[k];
    if (!isEqual(a, b)) {
      out.push({
        fieldKey: k,
        from: a ?? null,
        to: b ?? null,
      });
    }
  }
  return out;
}

/**
 * Survey response changelog for facility (logs.changes).
 * Response: { changes: Array<{ id, loggedAt, tableName, recordId, changedBy, fieldChanges, recordData }> }
 * fieldChanges: { fieldKey, from, to }[] — only rows after the first snapshot per DB record (edit history only).
 */
surveyResponse.get(
  '/:id/changes',
  asyncHandler(async (req, res) => {
    const { models, params, db } = req;
    req.checkPermission('read', 'SurveyResponse');

    const surveyResponseRecord = await models.SurveyResponse.findByPk(params.id);
    if (!surveyResponseRecord) throw new NotFoundError('Survey response not found');

    const survey = await surveyResponseRecord.getSurvey();
    if (!survey) throw new NotFoundError('Associated survey not found');

    if (survey.surveyType !== SURVEY_TYPES.PROGRAMS) {
      throw new InvalidOperationError('Changelog is only available for program survey responses');
    }

    req.checkPermission('read', survey);

    const rawRows = await db.query(
      `
        SELECT
          c.id,
          c.created_at AS "loggedAt",
          c.table_name AS "tableName",
          c.record_id AS "recordId",
          c.record_data AS "recordData",
          c.updated_by_user_id AS "updatedByUserId",
          u.display_name AS "changedByDisplayName"
        FROM
          logs.changes c
          LEFT JOIN users u ON u.id = c.updated_by_user_id
        WHERE
          c.migration_context IS NULL
          AND ((c.table_name = 'survey_responses'
              AND c.record_id = :surveyResponseId)
            OR (c.table_name = 'survey_response_answers'
              AND (c.record_data ->> 'response_id') = :surveyResponseId))
        ORDER BY
          c.created_at ASC
    `,
      {
        replacements: { surveyResponseId: params.id },
        type: QueryTypes.SELECT,
      },
    );

    const seqByKey = {};
    const rowsWithSeq = rawRows.map(row => {
      const key = `${row.tableName}\0${row.recordId}`;
      seqByKey[key] = (seqByKey[key] || 0) + 1;
      return { ...row, _seq: seqByKey[key] };
    });

    const editRowsOnly = rowsWithSeq.filter(r => r._seq > 1);

    const changes = editRowsOnly.map(row => {
      const prevRow = rowsWithSeq.find(
        r =>
          r.tableName === row.tableName && r.recordId === row.recordId && r._seq === row._seq - 1,
      );
      const prevData = prevRow?.recordData ?? null;
      const fieldChanges = diffKeys(prevData, row.recordData);
      return {
        id: row.id,
        loggedAt: row.loggedAt,
        tableName: row.tableName,
        recordId: row.recordId,
        recordData: row.recordData,
        changedBy: {
          id: row.updatedByUserId,
          displayName: row.changedByDisplayName,
        },
        fieldChanges,
      };
    });

    changes.reverse();

    await req.audit.access({
      recordId: surveyResponseRecord.id,
      frontEndContext: { ...params, changelog: true },
      model: models.SurveyResponse,
      facilityId: req.query.facilityId,
    });

    res.send({ changes });
  }),
);

surveyResponse.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models, params, query } = req;
    req.checkPermission('read', 'SurveyResponse');

    const surveyResponseRecord = await models.SurveyResponse.findByPk(params.id);
    if (!surveyResponseRecord) {
      throw new NotFoundError('Survey response not found');
    }
    const survey = await surveyResponseRecord.getSurvey();
    if (!survey) {
      throw new NotFoundError('Associated survey not found');
    }

    req.checkPermission('read', survey);

    const components = await models.SurveyScreenComponent.getComponentsForSurvey(
      surveyResponseRecord.surveyId,
      { includeAllVitals: true },
    );
    const answers = await models.SurveyResponseAnswer.findAll({
      where: { responseId: params.id },
    });

    const transformedAnswers = await transformAnswers(models, answers, components, {
      notTransformDate: true,
    });

    await req.audit.access({
      recordId: surveyResponseRecord.id,
      frontEndContext: params,
      model: models.SurveyResponse,
      facilityId: query.facilityId,
    });

    res.send({
      ...surveyResponseRecord.forResponse(),
      surveyName: survey.name,
      components,
      answers: answers.map(answer => {
        const transformedAnswer = transformedAnswers.find(a => a.id === answer.id);
        return {
          ...answer.dataValues,
          originalBody: answer.body,
          body: transformedAnswer?.body,
          sourceType: transformedAnswer?.sourceType,
          sourceConfig: transformedAnswer?.sourceConfig,
        };
      }),
    });
  }),
);

export async function createSurveyResponse(req) {
  const {
    models,
    body: { facilityId, ...body },
    settings,
  } = req;

  // Responses for the vitals survey will check against 'Vitals' create permissions
  // All others will check against 'SurveyResponse' create permissions
  const noun = await models.Survey.getResponsePermissionCheck(body.surveyId);
  if (noun === 'Charting') {
    req.checkPermission('create', subject('Charting', { id: body.surveyId }));
  } else {
    req.checkPermission('create', noun);
  }

  const getDefaultId = async type =>
    models.SurveyResponseAnswer.getDefaultId(type, settings[facilityId]);
  const updatedBody = {
    locationId: body.locationId || (await getDefaultId('location')),
    departmentId: body.departmentId || (await getDefaultId('department')),
    userId: req.user.id,
    facilityId,
    ...body,
  };
  return await models.SurveyResponse.createWithAnswers(updatedBody);
}

surveyResponse.post(
  '/',
  asyncHandler(async (req, res) => {
    const responseRecord = await req.db.transaction(async () => {
      return await createSurveyResponse(req);
    });
    res.send(responseRecord);
  }),
);

surveyResponse.put(
  '/complexChartInstance/:id',
  asyncHandler(async (req, res) => {
    const { models, body, params, db } = req;

    const responseRecord = await models.SurveyResponse.findByPk(params.id);
    if (!responseRecord) {
      throw new NotFoundError('Response record not found');
    }

    req.checkPermission('write', subject('Charting', { id: responseRecord.surveyId }));

    const survey = await responseRecord.getSurvey();
    if (survey.surveyType !== SURVEY_TYPES.COMPLEX_CHART_CORE) {
      throw new InvalidOperationError('Cannot edit survey responses');
    }

    const components = await models.SurveyScreenComponent.getComponentsForSurvey(survey.id);

    await db.transaction(async () => {
      const responseAnswers = await models.SurveyResponseAnswer.findAll({
        attributes: ['id', 'dataElementId'],
        where: { responseId: params.id },
      });

      for (const [dataElementId, value] of Object.entries(body.answers)) {
        if (!components.some(c => c.dataElementId === dataElementId)) {
          throw new InvalidOperationError('Some components are missing from the survey');
        }

        // Ignore null values
        if (value === null) {
          continue;
        }

        const existingAnswer = responseAnswers.find(a => a.dataElementId === dataElementId);
        if (existingAnswer) {
          await existingAnswer.update({ body: value });
        } else {
          await models.SurveyResponseAnswer.create({
            dataElementId,
            body: value,
            responseId: params.id,
          });
        }
      }
    });

    res.send(responseRecord);
  }),
);

surveyResponse.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models, params, body } = req;
    req.checkPermission('read', 'SurveyResponse');

    const responseRecord = await models.SurveyResponse.findByPk(params.id);
    if (!responseRecord) {
      throw new NotFoundError('Survey response not found');
    }

    const survey = await responseRecord.getSurvey();
    if (!survey) {
      throw new NotFoundError('Associated survey not found');
    }
    if (survey.surveyType !== SURVEY_TYPES.PROGRAMS) {
      throw new InvalidOperationError('Cannot edit survey responses');
    }

    req.checkPermission('write', survey);

    const facilityId = body?.facilityId;
    if (!facilityId) throw new InvalidParameterError('facilityId is required');

    const patchedAnswers = body?.answers;
    if (!isObject(patchedAnswers)) throw new InvalidParameterError('answers is required');

    const components = await models.SurveyScreenComponent.getComponentsForSurvey(survey.id);
    const componentByDataElementId = new Map(components.map(c => [c.dataElementId, c]));
    const validDataElementIds = new Set(componentByDataElementId.keys());

    await req.db.transaction(async () => {
      const responseAnswers = await models.SurveyResponseAnswer.findAll({
        attributes: ['id', 'dataElementId', 'body'],
        where: { responseId: params.id },
      });

      const mergedAnswerValues = {};
      for (const answer of responseAnswers) {
        mergedAnswerValues[answer.dataElementId] = answer.body;
      }

      for (const [dataElementId, value] of Object.entries(patchedAnswers)) {
        if (!validDataElementIds.has(dataElementId)) {
          throw new InvalidOperationError('Some components are missing from the survey');
        }

        if (value === null) continue;

        const dataElementType = componentByDataElementId.get(dataElementId)?.dataElement?.type;
        const bodyValue = await getBodyForAnswer(dataElementType, value, models);
        if (bodyValue === null) continue;

        const existingAnswer = responseAnswers.find(a => a.dataElementId === dataElementId);
        if (existingAnswer) {
          await existingAnswer.update({ body: bodyValue });
        } else {
          await models.SurveyResponseAnswer.create({
            dataElementId,
            body: bodyValue,
            responseId: params.id,
          });
        }
        mergedAnswerValues[dataElementId] = bodyValue;
      }

      // Recalculate calculated questions and persist them
      const calculatedValues = runCalculations(components, mergedAnswerValues);
      for (const [dataElementId, value] of Object.entries(calculatedValues)) {
        if (!validDataElementIds.has(dataElementId)) continue;
        const dataElementType = componentByDataElementId.get(dataElementId)?.dataElement?.type;
        const bodyValue = getStringValue(dataElementType, value) ?? '';
        const existingAnswer = responseAnswers.find(a => a.dataElementId === dataElementId);
        if (existingAnswer) {
          await existingAnswer.update({ body: bodyValue });
        } else {
          await models.SurveyResponseAnswer.create({
            dataElementId,
            body: bodyValue,
            responseId: params.id,
          });
        }
        mergedAnswerValues[dataElementId] = bodyValue;
      }

      const encounter = await responseRecord.getEncounter();
      const { result, resultText } = getResultValue(components, mergedAnswerValues, {
        encounterType: encounter?.encounterType,
      });
      await responseRecord.update({ result, resultText });

      // Re-run actions without changing submission time
      await handleSurveyResponseActions(
        models,
        facilityId,
        components,
        mergedAnswerValues,
        responseRecord.patientId,
        responseRecord.surveyId,
        req.user.id,
        responseRecord.endTime,
      );
    });

    res.send({ ok: true });
  }),
);

surveyResponse.get(
  '/patient-data-field-association-data/:column',
  asyncHandler(async (req, res) => {
    const { models, params, query } = req;
    const value = query.value;
    const column = params.column;

    req.checkPermission('read', 'Patient');

    if (!column) {
      throw new InvalidParameterError('Column parameter is required');
    }
    if (!value) {
      res.json({
        data: null,
      });
      return;
    }

    if (!PATIENT_DATA_FIELD_LOCATIONS[column]) {
      throw new InvalidParameterError('Invalid column');
    }

    const [modelName, fieldName] = PATIENT_DATA_FIELD_LOCATIONS[column];

    const { data, targetModel } = await getPatientDataFieldAssociationData({
      models,
      modelName,
      fieldName,
      answer: value,
    });

    res.json({
      model: targetModel,
      data,
    });
  }),
);
