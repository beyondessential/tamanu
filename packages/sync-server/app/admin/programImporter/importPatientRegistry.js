import { utils } from 'xlsx';
import { SURVEY_TYPES } from '@tamanu/constants';

import { log } from 'shared/services/logging';
import { ImporterMetadataError } from '../errors';
import { importRows } from '../importRows';

import { readSurveyQuestions } from './readSurveyQuestions';
import { ensureRequiredQuestionsPresent, validateVitalsSurvey } from './validation';
import { validateProgramDataElementRecords } from './vitalsValidation';
import { readOneToManySheet } from './readMetadata';

function readPatientRegistryData(workbook) {
  log.debug('Checking for PatientRegistry sheet');
  if (!workbook.Sheets.PatientRegistry) {
    return {};
  }

  log.debug('Reading PatientRegistry data');
  const {
    primaryRecord: patientRegistryRecord,
    secondaryRecords: clinicalStatuses,
  } = readOneToManySheet(workbook.Sheets.PatientRegistry, 'PatientRegistry');

  return {
    patientRegistryRecord,
    clinicalStatuses,
  };
}

export async function importPatientRegistry(context, workbook, surveyInfo) {
  const { patientRegistryRecord, clinicalStatuses } = readPatientRegistryData(workbook);

  if (!patientRegistryRecord) return;

  // actually import the programRegistry to the database
  return (
    importRows(context, {
      sheetName: 'PatientRegistry',
      rows: [
        {
          model: 'Program',
          values: patientRegistryRecord,
          sheetRow: 0,
        },
      ],
    }),
    log.debug('Importing surveys', {
      count: surveysToImport.length,
    })
  );

  // then loop over each survey defined in metadata and import it
  for (const surveyInfo of surveysToImport) {
    try {
      const context = createContext(surveyInfo.name);
      const result = await importSurvey(context, workbook, surveyInfo);
      stats.push(result);
    } catch (e) {
      errors.push(e);
    }
  }

  const records = getPat(workbook, surveyInfo);
  const stats = validateProgramDataElementRecords(records, { context, sheetName });

  return importRows(context, {
    sheetName,
    rows: records,
    stats,
  });
}
