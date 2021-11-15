import { inRange } from 'lodash';
import { QueryTypes } from 'sequelize';

import { log } from 'shared/services/logging';

const SURVEY_RESPONSE_BATCH_SIZE = 1000;

const checkVisibilityCriteria = (component, allComponents, answerByCode) => {
  const { visibilityCriteria } = component;
  // nothing set - show by default
  if (!visibilityCriteria) return true;

  try {
    const criteriaObject = JSON.parse(visibilityCriteria);

    if (!criteriaObject) {
      return true;
    }

    const { _conjunction: conjunction, hidden, ...restOfCriteria } = criteriaObject;
    if (Object.keys(restOfCriteria).length === 0) {
      return true;
    }

    const checkIfQuestionMeetsCriteria = ([questionCode, answersEnablingFollowUp]) => {
      const value = answerByCode[questionCode];

      if (answersEnablingFollowUp.type === 'range') {
        if (!value) return false;
        const { start, end } = answersEnablingFollowUp;

        if (!start) return value < end;
        if (!end) return value >= start;
        if (inRange(value, parseFloat(start), parseFloat(end))) {
          return true;
        }
      }

      const matchingComponent = allComponents.find(x => x.code === questionCode);
      if (matchingComponent?.type === 'MultiSelect') {
        const givenValues = answerByCode[questionCode].split(', ');
        return givenValues.includes(answersEnablingFollowUp);
      }

      return answersEnablingFollowUp.includes(value);
    };

    return conjunction === 'and'
      ? Object.entries(restOfCriteria).every(checkIfQuestionMeetsCriteria)
      : Object.entries(restOfCriteria).some(checkIfQuestionMeetsCriteria);
  } catch (error) {
    console.log(`Error parsing JSON visilbity criteria, using fallback.
                    \nError message: ${error}`);

    return false;
  }
};

const formatResultText = value =>
  // as percentage
  `${value.toFixed(0)}%`;

const getAnswerByCode = answerRows => {
  const answerByCode = {};
  answerRows.forEach(answerRow => {
    answerByCode[answerRow.code] = answerRow.answer;
  });
  return answerByCode;
};

const calculateSurveyResult = async (store, surveyResponseId, surveyComponents) => {
  const [answerRows] = await store.sequelize.query(`
    SELECT program_data_elements.code AS "code",
    survey_response_answers.body AS "answer"
    FROM survey_response_answers
    INNER JOIN program_data_elements
      ON program_data_elements.id = survey_response_answers.data_element_id
    WHERE survey_response_answers.response_id = '${surveyResponseId}'
  `);

  const answerByCode = getAnswerByCode(answerRows);
  const visibleResultComponents = surveyComponents
    .filter(component => component.type === 'Result')
    .filter(component => checkVisibilityCriteria(component, surveyComponents, answerByCode));

  // use the last visible component in the array
  const finalResultComponent = visibleResultComponents[visibleResultComponents.length - 1];
  if (!finalResultComponent) {
    // this survey does not have a result field
    return { result: 0, resultText: '' };
  }

  const rawValue = answerByCode[finalResultComponent.code];

  // invalid values just get empty results
  if (rawValue === undefined || rawValue === null || Number.isNaN(rawValue)) {
    return { result: 0, resultText: finalResultComponent.detail || '' };
  }

  // string values just get passed on directly
  if (typeof rawValue === 'string') {
    return { result: 0, resultText: rawValue };
  }

  // numeric data gets formatted
  return {
    result: rawValue,
    resultText: formatResultText(rawValue, finalResultComponent),
  };
};

const calculateSurveyResultsInBatch = async (
  store,
  surveyId,
  surveyComponents,
  batchSize,
  offset,
) => {
  const [surveyResponseRows] = await store.sequelize.query(
    `
      SELECT survey_responses.id
      FROM survey_responses
      WHERE survey_id = '${surveyId}'
      LIMIT ${batchSize}
      OFFSET ${offset * batchSize}
    `,
  );

  for (const { id: surveyResponseId } of surveyResponseRows) {
    const { resultText } = await calculateSurveyResult(store, surveyResponseId, surveyComponents);

    // Update the result text and updated_at to trigger sync
    await store.sequelize.query(`
        UPDATE survey_responses
        SET result_text = '${resultText}',
        updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = '${surveyResponseId}'
      `);
    log.info(`Result generated for survey response with id ${surveyResponseId}`);
  }
};

export async function calculateSurveyResults(store, options) {
  const [surveyRows] = await store.sequelize.query(`
    SELECT DISTINCT surveys.id
    FROM surveys
    INNER JOIN survey_screen_components
      ON surveys.id = survey_screen_components.survey_id
    INNER JOIN program_data_elements
      ON program_data_elements.id = survey_screen_components.data_element_id
    WHERE program_data_elements.type = 'Result';
  `);

  for (const { id: surveyId } of surveyRows) {
    const [surveyComponents] = await store.sequelize.query(`
        SELECT program_data_elements.code AS "code",
          program_data_elements.type AS "type",
          survey_screen_components.visibility_criteria AS "visibilityCriteria",
          survey_screen_components.detail AS "detail"
        FROM survey_screen_components
        INNER JOIN program_data_elements
          ON program_data_elements.id = survey_screen_components.data_element_id
        WHERE survey_id = '${surveyId}'
        ORDER BY survey_screen_components.screen_index, survey_screen_components.component_index;
    `);

    const [surveyResponseCountRows] = await store.sequelize.query(`
        SELECT COUNT(*)
        FROM survey_responses
        WHERE survey_id = '${surveyId}';
    `);
    const surveyResponseCount = surveyResponseCountRows[0].count;
    const batchCount = Math.ceil(surveyResponseCount / SURVEY_RESPONSE_BATCH_SIZE);

    // Run in batches to avoid OOM issue
    for (let i = 0; i < batchCount; i++) {
      await calculateSurveyResultsInBatch(
        store,
        surveyId,
        surveyComponents,
        SURVEY_RESPONSE_BATCH_SIZE,
        i,
      );
    }
  }
  process.exit(0);
}
