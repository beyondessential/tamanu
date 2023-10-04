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
        } catch {
          log.warn(`The following record body is not a valid JSON array: ${record.id}`);
          return location;
        }

        const parsedBody = JSON.parse(body);
        await record.update({ body: parsedBody });
        migrated++;

        return location;
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
  .description('Reformats survey answers from comma seperated to JSON valid array')
  .action(reformatMultiSelectSurveyResponses);
