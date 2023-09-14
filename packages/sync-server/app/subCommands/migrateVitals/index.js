import { Command } from 'commander';
import { Sequelize } from 'sequelize';
import { SURVEY_TYPES } from '@tamanu/constants';
import { log } from 'shared/services/logging';
import { v4 as generateId } from 'uuid';
import { ReadSettings } from '@tamanu/settings';
import { initDatabase } from '../../database';

const BATCH_COUNT = 100;
export const COLUMNS_TO_DATA_ELEMENT_ID = {
  dateRecorded: 'pde-PatientVitalsDate',
  temperature: 'pde-PatientVitalsTemperature',
  weight: 'pde-PatientVitalsWeight',
  height: 'pde-PatientVitalsHeight',
  sbp: 'pde-PatientVitalsSBP',
  dbp: 'pde-PatientVitalsDBP',
  heartRate: 'pde-PatientVitalsHeartRate',
  respiratoryRate: 'pde-PatientVitalsRespiratoryRate',
  spo2: 'pde-PatientVitalsSPO2',
  avpu: 'pde-PatientVitalsAVPU',
};

const conversionFunctions = {
  temperature: (value, unit) => {
    if (value && unit === 'fahrenheit') {
      // Do this the hard way so we don't need to add a conversion lib to sync
      return (value * (9 / 5) + 32).toFixed(1);
    }
    return value;
  },
};

export async function migrateVitals() {
  const store = await initDatabase({ testMode: false });
  const { models, sequelize } = store;

  const settings = new ReadSettings(models);

  const vitalsSurvey = await models.Survey.findOne({
    where: {
      surveyType: SURVEY_TYPES.VITALS,
    },
  });

  if (!vitalsSurvey) {
    log.error('Vitals migration failed: no vitals survey found');
    process.exit(1);
  }

  let toProcess = await models.Vitals.count({
    where: {
      migrated_record: null,
    },
  });

  log.info(`Found ${toProcess} vitals records to migrate`);

  while (toProcess > 0) {
    // Slightly inaccurate, but editing the loop var inside the transaction callback is unsafe
    toProcess -= BATCH_COUNT;

    log.debug('Starting transaction');
    await sequelize.transaction(
      {
        // strongest level to be sure to read/write good data
        isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
      },
      async () => {
        const vitalsChunk = await models.Vitals.findAll({
          where: {
            migrated_record: null,
          },
          limit: BATCH_COUNT,
        });
        log.info(`Processing batch of ${vitalsChunk.length} vitals records`);

        // Map the new ids so we can look them up when generating the answer records
        const idMap = new Map(vitalsChunk.map(vital => [vital.dataValues.id, generateId()]));
        const newResponses = vitalsChunk.map(vital => ({
          id: idMap.get(vital.dataValues.id),
          encounterId: vital.dataValues.encounterId,
          updatedAt: vital.dataValues.updatedAt,
          createdAt: vital.dataValues.createdAt,
          startTime: vital.dataValues.dateRecorded,
          endTime: vital.dataValues.dateRecorded,
          surveyId: vitalsSurvey.dataValues.id,
        }));
        await models.SurveyResponse.bulkCreate(newResponses);

        const units = await settings.get('units');

        // Each survey response generates many answer, map them to an array of arrays then flatten
        const answerData = vitalsChunk.map(vital =>
          Object.entries(vital.dataValues)
            .filter(([key, value]) => value && COLUMNS_TO_DATA_ELEMENT_ID[key])
            .map(([key, value]) => ({
              dataElementId: COLUMNS_TO_DATA_ELEMENT_ID[key],
              responseId: idMap.get(vital.dataValues.id),
              body: conversionFunctions[key] ? conversionFunctions[key](value, units[key]) : value,
            })),
        );
        await models.SurveyResponseAnswer.bulkCreate(answerData.flat());

        // models.Vitals.update will error if you don't update the encounterId because the validation triggers against the updated field list
        await sequelize.query(
          `
          UPDATE vitals SET migrated_record = response_id
          FROM (SELECT unnest(ARRAY[:keys]) AS vital_id,
                unnest(ARRAY[:values]) AS response_id) map
          WHERE map.vital_id = vitals.id
        `,
          {
            replacements: { keys: [...idMap.keys()], values: [...idMap.values()] },
          },
        );
      },
    );
  }
}

export const migrateVitalsCommand = new Command('migrateVitals')
  .description('Migrates vitals from legacy format to new format as survey responses')
  .action(migrateVitals);
