import { log } from '@tamanu/shared/services/logging';
import { readFile } from 'xlsx';

import { importRows } from '../importRows';

import { readMetadata } from './readMetadata';
import { importSurvey } from './importSurvey';

export const PERMISSIONS = ['Program', 'Survey'];

export async function programImporter({
  errors,
  models,
  stats,
  file,
  whitelist = [],
  checkPermission,
}) {
  checkPermission('create', 'Program');
  checkPermission('write', 'Program');

  const createContext = sheetName => ({
    errors,
    log: log.child({
      file,
      sheetName,
    }),
    models,
  });

  log.info('Importing surveys from file', { file });

  const workbook = readFile(file);
  const { programRecord, surveyMetadata } = await readMetadata(workbook.Sheets.Metadata);

  // actually import the program to the database
  stats.push(
    await importRows(createContext('Metadata'), {
      sheetName: 'Metadata',
      rows: [
        {
          model: 'Program',
          values: programRecord,
          sheetRow: 0,
        },
      ],
    }),
  );

  const surveysToImport = surveyMetadata.filter(({ name, code }) => {
    // check against whitelist
    if (!whitelist || whitelist.length === 0) {
      return true;
    }

    return whitelist.some(x => x === name || x === code);
  });

  log.debug('Importing surveys', {
    count: surveysToImport.length,
  });

  // then loop over each survey defined in metadata and import it
  for (const surveyInfo of surveysToImport) {
    checkPermission('create', 'Survey');
    checkPermission('write', 'Survey');

    try {
      const context = createContext(surveyInfo.name);
      const result = await importSurvey(context, workbook, surveyInfo);
      stats.push(result);
    } catch (e) {
      errors.push(e);
    }
  }

  log.debug('Done importing programs data');
}
