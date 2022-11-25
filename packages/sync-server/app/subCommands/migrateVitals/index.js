import { Command } from 'commander';
import { Sequelize } from 'sequelize/types';
import { SURVEY_TYPES } from 'shared/constants';
import { log } from 'shared/services/logging';
import { initDatabase } from '../../database';

const COLUMNS_TO_CODE = {
  date: 'PatientVitalsDate',
  temperature: 'PatientVitalsTemperature',
};

export async function migrateVitals(options) {
  const store = await initDatabase({ testMode: false });
  const { models } = store;

  const batchCount = 100;

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
    /**
     *     
      return models.SurveyResponse.createWithAnswers(updatedBody);

       models.SurveyResponseAnswer.create({
        dataElementId: dataElement.id,
        body,
        responseId: record.id,
      });
    });
     */
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
          limit: batchCount,
        });

        const surveyResponses = vitalsChunk.map(
          ({ encounterId, updatedAt, createdAt, dateRecorded }) => {
            return {
              encounterId,
              updatedAt,
              createdAt,
              // Should these be date recorded or created at
              startTime: dateRecorded,
              endTime: dateRecorded,
              surveyId: vitalsSurvey.id,
            };
          },
        );
      },
    );
  }
}

export const migrateVitalsCommand = new Command('migrateVitals')
  .description('Migrates vitals from legacy format to new format as survey responses')

  .action(migrateVitals);
