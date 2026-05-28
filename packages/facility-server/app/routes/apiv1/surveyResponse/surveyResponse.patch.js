import asyncHandler from 'express-async-handler';
import { isEqual, isPlainObject } from 'lodash';

import { PROGRAM_DATA_ELEMENT_TYPES, SURVEY_TYPES } from '@tamanu/constants';
import { InvalidOperationError, InvalidParameterError, NotFoundError } from '@tamanu/errors';
import { runCalculations } from '@tamanu/shared/utils/calculations';
import { getResultValue, getStringValue } from '@tamanu/shared/utils/fields';
import { datetimeCustomValidation } from '@tamanu/utils/dateTime';

/** @param {string | null | undefined} answer */
function isNonAnswer(answer) {
  return answer == null || answer === '';
}

/**
 * @param {string | null | undefined} a
 * @param {string | null | undefined} b
 */
function isEquivalent(a, b) {
  return a === b || (isNonAnswer(a) && isNonAnswer(b));
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

export const surveyResponsePatchHandler = asyncHandler(async (req, res) => {
  const { models, params, body } = req;
  req.checkPermission('read', 'SurveyResponse');

  const facilityId = body?.facilityId;
  if (!facilityId) throw new InvalidParameterError('facilityId is required');

  const patchedAnswers = body?.answers;
  if (!isPlainObject(patchedAnswers)) throw new InvalidParameterError('answers is required');

  const editedTime = body?.editedTime;
  if (!editedTime) throw new InvalidParameterError('editedTime is required');
  if (!datetimeCustomValidation.safeParse(editedTime).success) {
    throw new InvalidParameterError('editedTime is invalid');
  }

  await req.db.transaction(async () => {
    const responseRecord = await models.SurveyResponse.findByPk(params.id);
    if (!responseRecord) {
      throw new NotFoundError('Survey response not found');
    }

    const survey = await responseRecord.getSurvey();
    if (!survey) {
      throw new NotFoundError('Associated survey not found');
    }
    req.checkPermission('write', survey);

    if (survey.surveyType !== SURVEY_TYPES.PROGRAMS) {
      throw new InvalidOperationError('Cannot edit survey responses');
    }

    const components = await models.SurveyScreenComponent.getComponentsForSurvey(survey.id);
    const componentByDataElementId = new Map(components.map(c => [c.dataElementId, c]));
    const validDataElementIds = new Set(componentByDataElementId.keys());
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
      const body = await models.SurveyResponse.getBodyForAnswer(dataElementType, value, models);
      if (body === null) continue;

      const existingAnswer = answerByDataElementId.get(dataElementId);
      if (existingAnswer) {
        if (!isEquivalent(existingAnswer.body, body)) {
          await existingAnswer.update({ body, editedTime });
          hasMeaningfulChanges = true;
        }
      } else if (!isNonAnswer(body)) {
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
      } else if (!isNonAnswer(bodyValue)) {
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
    await models.SurveyResponse.handleSurveyResponseActions(
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
