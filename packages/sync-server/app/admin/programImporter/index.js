import { log } from 'shared/services/logging';
import { readFile, utils } from 'xlsx';

import { ValidationError } from '../errors';
import { importRows } from '../importRows';

import { readMetadata } from './readMetadata';
import { importSurvey } from './importSurvey';

export const PERMISSIONS = ['Program', 'Survey'];

export async function importer({ errors, models, stats, file, whitelist = [] }) {

  const createContext = sheetName => ({
    errors,
    log: log.child({
      file,
      sheetName,
    }),
    models,
  });

  log.info('Importing programs from file', { file });

  const workbook = readFile(file);
  const programMetadata = await readMetadata(workbook.Sheets.Metadata);

  // actually import the program to the database
  const { programId, programName } = programMetadata;
  stats.push(
    await importRows(createContext('metadata'), {
      sheetName: 'metadata',
      rows: [
        {
          model: 'Program',
          values: { id: programId, name: programName },
          sheetRow: 0,
        },
      ],
    }),
  );

  // read metadata table starting at header row
  const { createSurveyInfo, headerRowIndex } = programMetadata;
  const surveyMetadata = utils.sheet_to_json(workbook.Sheets.Metadata, { range: headerRowIndex });

  const shouldImportSurvey = ({ status = '', name, code }, rowIndex) => {
    // check against whitelist
    if (whitelist && whitelist.length > 0) {
      if (!whitelist.some(x => x === name || x === code)) {
        return false;
      }
    }

    // check against home server & publication status
    switch (status) {
      case 'publish':
        return true;
      case 'hidden':
        return false;
      case 'draft':
      case '':
        return !importingToHome;
      default:
        throw new ValidationError(
          'Metadata',
          rowIndex + headerRowIndex,
          `Survey ${name} has invalid status ${status}. Must be one of publish, draft, hidden.`,
        );
    }
  };

  const surveysToImport = surveyMetadata.filter(shouldImportSurvey)
  log.debug('Loop over surveys', { countInWorkbook: surveyMetadata.length, count: surveysToImport.length });

  // then loop over each survey defined in metadata and import it
  for (const survey of surveysToImport) {
    try {
      const context = createContext(survey.name);
      const result = await importSurvey(
        context, 
        createSurveyInfo, 
        workbook, 
        survey,
      );
      stats.push(result);
    } catch(e) {
      errors.push(e);
    }
  }

  log.debug('Done importing programs data');
}
