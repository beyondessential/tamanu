import { Command } from 'commander';
import { log } from 'shared/services/logging';
import { VITALS_DATA_ELEMENT_IDS } from 'shared/constants';
import { getCurrentDateTimeString } from 'shared/utils/dateTime';
import { initDatabase } from '../database';

const SURVEY_RESPONSE_BATCH_SIZE = 1000;

async function generateVitalLogsInBatch(store, vitalsSurveyId, batchSize, offset) {
  const { sequelize } = store;
  const [, metadata] = await sequelize.query(
    `
      WITH
        paginated_survey_responses AS (
          SELECT id, end_time, start_time, user_id
          FROM survey_responses
          WHERE survey_id = :vitalsSurveyId
          ORDER BY created_at ASC, id ASC
          LIMIT :limit
          OFFSET :offset
        )

      INSERT INTO
        vital_logs (created_at, updated_at, date, new_value, recorded_by_id, answer_id)
      SELECT
        now() as created_at,
        now() as updated_at,
        COALESCE(psr.end_time, psr.start_time, :currentDateTimeString) as date,
        sra.body as new_value,
        psr.user_id as recorded_by_id,
        sra.id as answer_id
      FROM
        paginated_survey_responses psr
      INNER JOIN
        survey_response_answers sra ON psr.id = sra.response_id
      LEFT JOIN
        vital_logs vl ON vl.answer_id = sra.id
      WHERE
        sra.body IS NOT NULL
      AND
        sra.body != ''
      AND
        sra.data_element_id != :dateDataElementId
      AND
        vl.id IS NULL;
    `,
    {
      replacements: {
        vitalsSurveyId,
        limit: batchSize,
        offset,
        dateDataElementId: VITALS_DATA_ELEMENT_IDS.dateRecorded,
        currentDateTimeString: getCurrentDateTimeString(),
      },
    },
  );

  log.info(typeof metadata.rowCount);
  return metadata.rowCount;
}

export async function generateInitialVitalLogs() {
  const store = await initDatabase({ testMode: false });
  const { Survey, SurveyResponse } = store.models;

  try {
    const vitalsSurvey = await Survey.getVitalsSurvey();
    const surveyResponseCount = await SurveyResponse.count({
      where: { surveyId: vitalsSurvey.id },
    });
    const batchCount = Math.ceil(surveyResponseCount / SURVEY_RESPONSE_BATCH_SIZE);
    log.info(
      `Generating initial vital logs for ${surveyResponseCount} survey responses in ${batchCount} batches of ${SURVEY_RESPONSE_BATCH_SIZE}`,
    );
    let totalCreated = 0;

    // Run in batches to avoid OOM issue
    for (let i = 0; i < batchCount; i++) {
      log.info(`Generating initial vital logs for batch ${i + 1}/${batchCount}`);
      const logsCreatedInBatch = await generateVitalLogsInBatch(
        store,
        vitalsSurvey.id,
        SURVEY_RESPONSE_BATCH_SIZE,
        i * SURVEY_RESPONSE_BATCH_SIZE,
      );
      totalCreated += logsCreatedInBatch;
    }

    log.info(`Successfully created ${totalCreated} initial vital logs.`);
    process.exit(0);
  } catch (error) {
    log.info(`Command failed: ${error.stack}\n`);
    process.exit(1);
  }
}

export const generateInitialVitalLogsCommand = new Command('generateInitialVitalLogs')
  .description('Generates missing initial vital log records for survey response answers')
  .action(generateInitialVitalLogs);
