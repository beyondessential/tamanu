import { Command } from 'commander';
import { SURVEY_TYPES } from 'shared/constants';
import { log } from 'shared/services/logging';
import { initDatabase } from '../../database';

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

//   const vitals = await models.Vital.findAll();
//   console.log(vitals);
}

export const migrateVitalsCommand = new Command('migrateVitals')
  .description('Migrates vitals from legacy format to new format')

  .action(migrateVitals);
