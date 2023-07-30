import { Command } from 'commander';
import { log } from 'shared/services/logging';
import { VITALS_DATA_ELEMENT_IDS } from 'shared/constants';
import { getCurrentDateTimeString } from 'shared/utils/dateTime';
import { initDatabase } from '../database';

const SURVEY_RESPONSE_BATCH_SIZE = 1000;

async function generateVitalLogsInBatch(store, vitalsSurveyId, batchSize, offset) {
  const { SurveyResponse, VitalLog } = store.models;

  const surveyResponses = await SurveyResponse.findAll({
    where: { surveyId: vitalsSurveyId },
    order: [
      ['createdAt', 'ASC'],
      ['id', 'ASC'],
    ],
    limit: batchSize,
    offset,
  });
  let createdLogs = 0;

  for (const response of surveyResponses) {
    const answers = await response.getAnswers();
    const dateAnswer = answers.find(
      answer => answer.dataElementId === VITALS_DATA_ELEMENT_IDS.dateRecorded,
    );

    // Make sure answer is not empty and isn't the date answer
    const answersWithValues = answers.filter(answer => answer.body && answer !== dateAnswer);
    for (const answer of answersWithValues) {
      // Make sure no vital log exists for this answer
      const vitalLogCount = await VitalLog.count({ where: { answerId: answer.id } });
      if (vitalLogCount !== 0) continue;

      await VitalLog.create({
        date: response.endTime || getCurrentDateTimeString(),
        newValue: answer.body,
        recordedById: response.userId,
        answerId: answer.id,
      });
      createdLogs++;
    }
  }

  return createdLogs;
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
