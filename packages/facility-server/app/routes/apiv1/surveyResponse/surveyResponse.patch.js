import { subject } from '@casl/ability';
import asyncHandler from 'express-async-handler';
import { isEqual, isPlainObject } from 'lodash';

import { PROGRAM_DATA_ELEMENT_TYPES, SURVEY_TYPES, VISIBILITY_STATUSES } from '@tamanu/constants';
import {
  InvalidOperationError,
  InvalidParameterError,
  NotFoundError,
  UsageError,
} from '@tamanu/errors';
import { runCalculations } from '@tamanu/shared/utils/calculations';
import {
  getActiveActionComponents,
  getResultValue,
  getStringValue,
} from '@tamanu/shared/utils/fields';
import { getPatientDataDbLocation } from '@tamanu/shared/utils/getPatientDataDbLocation';
import { datetimeCustomValidation } from '@tamanu/utils/dateTime';
import { safeJsonParse } from '@tamanu/utils/safeJsonParse';

/** @param {string | null | undefined} body */
function isEmpty(body) {
  return body == null || body === '';
}

/**
 * @param {string | null | undefined} a
 * @param {string | null | undefined} b
 */
function isEquivalent(a, b) {
  return a === b || (isEmpty(a) && isEmpty(b));
}

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

/** Omit existing calculated/result bodies so a cleared input does not leave stale values. */
function rerunCalculations(components, mergedAnswerValues) {
  const valuesForCalculation = { ...mergedAnswerValues };
  for (const component of components) {
    if (component.calculation) {
      delete valuesForCalculation[component.dataElementId];
    }
  }
  return runCalculations(components, valuesForCalculation);
}

async function createPatientIssues(models, questions, patientId, recordedDate) {
  if (!models.PatientIssue.sequelize.isInsideTransaction()) {
    throw new UsageError('createPatientIssues must always run inside a transaction!');
  }
  const issueQuestions = questions.filter(
    q => q.dataElement.type === PROGRAM_DATA_ELEMENT_TYPES.PATIENT_ISSUE,
  );
  for (const question of issueQuestions) {
    const config = safeJsonParse(question.config);
    if (!config?.issueNote || !config.issueType) {
      throw new InvalidOperationError(
        `Ill-configured PatientIssue with config: ${question.config}`,
      );
    }
    const issueData = {
      patientId,
      type: config.issueType,
      note: config.issueNote,
    };
    if (recordedDate) issueData.recordedDate = recordedDate;

    const existing = await models.PatientIssue.findOne({
      attributes: ['id'], // Arbitrary projection, just checking existence
      where: issueData,
    });
    if (existing !== null) continue; // Prevent duplicates when program responses are edited
    await models.PatientIssue.create(issueData);
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
  await createPatientIssues(models, activeQuestions, patientId, submittedTime);
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

export const surveyResponsePatchHandler = asyncHandler(async (req, res) => {
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
  if (!isPlainObject(patchedAnswers)) throw new InvalidParameterError('answers is required');

  const editedTime = body?.editedTime;
  if (!editedTime) throw new InvalidParameterError('editedTime is required');
  if (!datetimeCustomValidation.safeParse(editedTime).success) {
    throw new InvalidParameterError('editedTime is invalid');
  }

  const components = await models.SurveyScreenComponent.getComponentsForSurvey(survey.id);
  const componentByDataElementId = new Map(components.map(c => [c.dataElementId, c]));
  const validDataElementIds = new Set(componentByDataElementId.keys());

  await req.db.transaction(async () => {
    const responseAnswers = await models.SurveyResponseAnswer.findAll({
      attributes: ['id', 'dataElementId', 'body'],
      where: { responseId: params.id },
    });
    const answerByDataElementId = new Map(responseAnswers.map(a => [a.dataElementId, a]));
    let hasMeaningfulChanges = false;

    const mergedAnswerValues = {};
    for (const answer of responseAnswers) {
      mergedAnswerValues[answer.dataElementId] = answer.body;
    }

    for (const [dataElementId, value] of Object.entries(patchedAnswers)) {
      if (!validDataElementIds.has(dataElementId)) {
        throw new InvalidOperationError(
          `Program data element ${dataElementId} is not part of survey ${survey.id}`,
        );
      }

      const dataElementType = componentByDataElementId.get(dataElementId)?.dataElement?.type;

      // Null in the patch means "no answer" for user-editable fields. Calculated/result values
      // are recalculated below; null there is just the client echoing an empty calculated field.
      if (value === null) {
        if (
          dataElementType === PROGRAM_DATA_ELEMENT_TYPES.CALCULATED ||
          dataElementType === PROGRAM_DATA_ELEMENT_TYPES.RESULT
        ) {
          continue;
        }

        mergedAnswerValues[dataElementId] = '';
        const clearedAnswer = answerByDataElementId.get(dataElementId);
        if (clearedAnswer && !isEquivalent(clearedAnswer.body, '')) {
          await clearedAnswer.update({ body: '', editedTime });
          hasMeaningfulChanges = true;
        }
        continue;
      }
      const body = await getBodyForAnswer(dataElementType, value, models);
      if (body === null) continue;

      const existingAnswer = answerByDataElementId.get(dataElementId);
      if (existingAnswer) {
        if (!isEquivalent(existingAnswer.body, body)) {
          await existingAnswer.update({ body, editedTime });
          hasMeaningfulChanges = true;
        }
      } else if (!isEmpty(body)) {
        const createdAnswer = await models.SurveyResponseAnswer.create({
          dataElementId,
          body,
          responseId: params.id,
          editedTime,
        });
        answerByDataElementId.set(dataElementId, createdAnswer);
        hasMeaningfulChanges = true;
      }
      mergedAnswerValues[dataElementId] = body;
    }

    const calculatedValues = rerunCalculations(components, mergedAnswerValues);
    for (const [dataElementId, value] of Object.entries(calculatedValues)) {
      if (!validDataElementIds.has(dataElementId)) continue;
      const dataElementType = componentByDataElementId.get(dataElementId)?.dataElement?.type;
      const bodyValue = getStringValue(dataElementType, value) ?? '';
      const existingAnswer = answerByDataElementId.get(dataElementId);
      if (existingAnswer) {
        if (!isEquivalent(existingAnswer.body, bodyValue)) {
          await existingAnswer.update({
            body: bodyValue,
            editedTime,
          });
          hasMeaningfulChanges = true;
        }
      } else if (!isEmpty(bodyValue)) {
        const newAnswer = await models.SurveyResponseAnswer.create({
          body: bodyValue,
          /**
           * This is the first time this question has been answered for this survey response, but
           * immediately give it an `edited_time` timestamp so we know that it was edited from the
           * original non-answer.
           */
          editedTime,
          dataElementId,
          responseId: params.id,
        });
        answerByDataElementId.set(dataElementId, newAnswer);
        hasMeaningfulChanges = true;
      }
      mergedAnswerValues[dataElementId] = bodyValue;
    }

    // Short circuit if no answer is actually different from existing
    if (!hasMeaningfulChanges) return;

    const encounter = await responseRecord.getEncounter();
    const { result, resultText } = getResultValue(components, mergedAnswerValues, {
      encounterType: encounter?.encounterType,
    });

    const responseUpdates = (() => {
      const updates = { editedTime };

      const normalizedResult = result ?? null;
      const normalizedResultText = resultText ?? null;
      if (!isEqual(responseRecord.result, normalizedResult)) {
        updates.result = normalizedResult;
      }
      if (!isEqual(responseRecord.resultText, normalizedResultText)) {
        updates.resultText = normalizedResultText;
      }
      if (survey.notifiable && responseRecord.endTime && Object.keys(updates).length > 0) {
        updates.notified = false; // Re-queue for SurveyCompletionNotifierProcessor
      }

      return updates;
    })();

    if (Object.keys(responseUpdates).length > 0) await responseRecord.update(responseUpdates);

    const patientIdForActions = responseRecord.patientId ?? encounter?.patientId;
    if (!patientIdForActions) {
      throw new InvalidOperationError(
        'Cannot re-run survey actions: survey response has no patient (missing patientId and encounter patient)',
      );
    }

    // Re-run actions without changing submission time
    await handleSurveyResponseActions(
      models,
      facilityId,
      components,
      mergedAnswerValues,
      patientIdForActions,
      responseRecord.surveyId,
      req.user.id,
      responseRecord.endTime,
    );
  });

  res.status(204).send();
});
