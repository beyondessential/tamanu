import { Command } from 'commander';
import { log } from 'shared/services/logging';
import { PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';
import { initDatabase } from '../database';

export async function reformatMultiSelectSurveyResponses() {
  log.info('Reformatting MultiSelect Survey responses...');

  const store = await initDatabase({ testMode: false });
  const { SurveyResponseAnswer } = store.models;

  try {
    let migrated = 0;
    const MultiSelectSurveyResponses = await SurveyResponseAnswer.findAll({
      include: 'programDataElement',
      where: { type: PROGRAM_DATA_ELEMENT_TYPES.MULTI_SELECT },
    });

    await Promise.all(
      MultiSelectSurveyResponses.map(async record => {
        const { body } = record;

        try {
          JSON.parse(body);
        } catch (error) {
          log.info(`Skipping ${record.id} as it is already JSON array`);
          return body;
        }

        const answerArray = body.split(', ');
        const arrayString = JSON.stringify(answerArray);
        await record.update({ body: arrayString });
        migrated++;

        return body;
      }),
    );

    log.info(`Successfully migrated ${migrated} records`);
    process.exit(0);
  } catch (error) {
    log.info(`Command failed: ${error.stack}\n`);
    process.exit(1);
  }
}

export const migrateImagingRequestsToLocationGroupsCommand = new Command(
  'reformatMultiSelectSurveyResponses',
)
  .description('Reformats survey answers from comma seperated string to JSON valid array string')
  .action(reformatMultiSelectSurveyResponses);
