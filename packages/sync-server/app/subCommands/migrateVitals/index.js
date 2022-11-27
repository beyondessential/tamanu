import { Command } from 'commander';
import { Sequelize } from 'sequelize/types';
import { SURVEY_TYPES } from 'shared/constants';
import { log } from 'shared/services/logging';
import { initDatabase } from '../../database';

const BATCH_COUNT = 100;
// or should it be to data element code
const COLUMNS_TO_DATA_ELEMENT_ID = {
  dateRecorded: 'PatientVitalsDate',
  temperature: 'PatientVitalsTemperature',
};

export async function migrateVitals(options) {
  const store = await initDatabase({ testMode: false });
  const { models } = store;


  const vitalsSurvey = await models.Survey.findOne({
    where: {
      surveyType: SURVEY_TYPES.VITALS,
    },
  });

  if (!vitalsSurvey) {
    log.error('Vitals migration failed: no vitals survey found');
    process.exit(1);
  }

  log.info(`Migrating ${toProcess} vitals to survey responses`);

  let toProcess = await models.Vital.count({
    where: {
      converted: false,
    },
  });
  while (toProcess) {
    log.debug('Starting transaction');

    await models.Vital.sequelize.transaction(
      {
        // strongest level to be sure to read/write good data
        isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
      },
      async () => {
        const vitalsChunk = await models.Vital.findAll({
          where: {
            converted: false,
          },
          limit: BATCH_COUNT,
        });

        // Should we bulk create the responses then bulk create the answers - currently we are looping over
        // the vitals and creating a response and answer for each one which kinda defeats the purpose of batching doesnt it.
        // We could also maybe start these concurrently if we cant do the bulk survey response method.

        for await (const vital of vitalsChunk) {
          const { encounterId, updatedAt, createdAt, dateRecorded } = vital;
          const { id: responseId } = await models.SurveyResponse.create({
            encounterId,
            updatedAt,
            createdAt,
            // Should these be date recorded or created at
            startTime: dateRecorded,
            endTime: dateRecorded,
            surveyId: vitalsSurvey.id,
          });
          const answerData = Object.entries(vital)
            .filter(([key]) => COLUMNS_TO_DATA_ELEMENT_ID[key])
            .map(([key, value]) => ({
              dataElementId: COLUMNS_TO_DATA_ELEMENT_ID[key],
              responseId,
              body: value,
            }));
          await models.Answer.bulkCreate(answerData);
        }
      },
    );
  }
}

export const migrateVitalsCommand = new Command('migrateVitals')
  .description('Migrates vitals from legacy format to new format as survey responses')

  .action(migrateVitals);
