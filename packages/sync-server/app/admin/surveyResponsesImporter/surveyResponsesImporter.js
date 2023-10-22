import { log } from 'shared/services/logging';
import { readFile } from 'xlsx';

import { importSurveyResponses } from './importSurveyResponses';

export async function surveyResponsesImporter({ errors, models, stats, file }) {
  const createContext = sheetName => ({
    // stats,
    errors,
    log: log.child({
      file,
      sheetName,
    }),
    models,
  });

  log.info('Importing survey responses from file', { file });

  const workbook = readFile(file);

  stats.push(await importSurveyResponses(workbook, createContext('Survey Responses')));

  log.debug('Done importing survey responses');
}
