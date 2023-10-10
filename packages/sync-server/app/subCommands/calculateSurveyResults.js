import { Command } from 'commander';
import { checkJSONCriteria } from '@tamanu/shared/utils/criteria';

import { log } from 'shared/services/logging';

import { initDatabase } from '../database';

const SURVEY_RESPONSE_BATCH_SIZE = 1000;

/**
 * IMPORTANT: We have 4 other versions of this method:
 *
 * - mobile/App/ui/helpers/fields.ts
 * - desktop/app/utils/survey.js
 * - shared/src/utils/fields.js
 * - sync-server/app/subCommands/calculateSurveyResults.js
 *
 * So if there is an update to this method, please make the same update
 * in the other versions
 */
const checkVisibilityCriteria = (component, allComponentsFromQuery, values) => {
  const allComponents = allComponentsFromQuery.map(x => ({
    dataElement: {
      code: x.code,
      type: x.type,
    },
  }));

  try {
    return checkJSONCriteria(component.visibilityCriteria, allComponents, values);
  } catch (error) {
    log.error(`Error message: ${error}`);

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
  const [answerRows] = await store.sequelize.query(
    `
    SELECT program_data_elements.code AS "code",
    survey_response_answers.body AS "answer"
    FROM survey_response_answers
    INNER JOIN program_data_elements
      ON program_data_elements.id = survey_response_answers.data_element_id
    WHERE survey_response_answers.response_id = :surveyResponseId
  `,
    {
      replacements: {
        surveyResponseId,
      },
    },
  );

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
      SELECT survey_responses.id,
      survey_responses.encounter_id AS "encounterId"
      FROM survey_responses
      WHERE survey_id = :surveyId
      ORDER BY survey_responses.id ASC
      LIMIT :batchSize
      OFFSET :offset
    `,
    {
      replacements: {
        surveyId,
        batchSize,
        offset: offset * batchSize,
      },
    },
  );

  for (const { id: surveyResponseId, encounterId } of surveyResponseRows) {
    const { resultText } = await calculateSurveyResult(store, surveyResponseId, surveyComponents);

    // Update the result text and updated_at
    await store.sequelize.query(
      `
      UPDATE survey_responses
      SET result_text = :resultText,
      updated_at = CURRENT_TIMESTAMP(3)
      WHERE id = :surveyResponseId
    `,
      {
        replacements: {
          resultText,
          surveyResponseId,
        },
      },
    );

    // Also update encounters.updated_at to trigger syncing down
    // inner survey responses to mobile / lan
    await store.sequelize.query(
      `
      UPDATE encounters
      SET updated_at = CURRENT_TIMESTAMP(3)
      WHERE id = :encounterId
    `,
      {
        replacements: {
          encounterId,
        },
      },
    );
    log.info(`Result generated for survey response with id ${surveyResponseId}`);
  }
};

/**
 * Due to an issue that none of the surveyResponse resultText was synced from mobile to sync-server,
 * this sub command can be used to rerun all the survey result calculations in sync-server.
 * Most of the code is copied pasted from tamanu-mobile
 * https://github.com/beyondessential/tamanu-mobile/blob/e81c87df3acb4518c808fbad399eec031a05e4c3/App/ui/helpers/fields.ts#L90
 * TODO: When we're sure that resultText are all syncing correctly, we can remove this sub command
 * @param {*} store
 * @param {*} options
 */
async function calculateSurveyResults() {
  const store = await initDatabase({ testMode: false });

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
    const [surveyComponents] = await store.sequelize.query(
      `
        SELECT program_data_elements.code AS "code",
          program_data_elements.type AS "type",
          survey_screen_components.visibility_criteria AS "visibilityCriteria",
          survey_screen_components.detail AS "detail"
        FROM survey_screen_components
        INNER JOIN program_data_elements
          ON program_data_elements.id = survey_screen_components.data_element_id
        WHERE survey_id = :surveyId
        ORDER BY survey_screen_components.screen_index, survey_screen_components.component_index ASC;
    `,
      {
        replacements: {
          surveyId,
        },
      },
    );

    const [surveyResponseCountRows] = await store.sequelize.query(
      `
        SELECT COUNT(*)
        FROM survey_responses
        WHERE survey_id = :surveyId;
    `,
      {
        replacements: {
          surveyId,
        },
      },
    );
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

  log.info('Finished calculating survey results');
  process.exit(0);
}

export const calculateSurveyResultsCommand = new Command('calculateSurveyResults')
  .description('Recalculate all survey results (intended to fix a specific bug)')
  .action(calculateSurveyResults);
