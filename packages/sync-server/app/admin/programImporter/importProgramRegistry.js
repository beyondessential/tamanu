import { utils } from 'xlsx';
import { SURVEY_TYPES } from '@tamanu/constants';

import { log } from 'shared/services/logging';
import { DataImportError } from '../errors';
import { importRows } from '../importRows';

import { readSurveyQuestions } from './readSurveyQuestions';
import { ensureRequiredQuestionsPresent, validateVitalsSurvey } from './validation';
import { validateProgramDataElementRecords } from './vitalsValidation';
import { readOneToManySheet } from './readMetadata';

function readProgramRegistryData(workbook) {
  log.debug('Checking for Registry sheet');
  if (!workbook.Sheets.Registry) {
    return {};
  }

  log.debug('Reading Registry data');
  const {
    primaryRecord: programRegistryRecord,
    secondaryRecords: clinicalStatuses,
  } = readOneToManySheet(workbook.Sheets.Registry, 'Registry');

  console.log(programRegistryRecord);

  if (!programRegistryRecord.registryCode) {
    throw new DataImportError('Registry', -2, 'A registry must have a code');
  }

  if (!programRegistryRecord.registryName) {
    throw new DataImportError('Registry', -2, 'A registry must have a name');
  }

  return {
    programRegistryRecord,
    clinicalStatuses,
  };
}

const readClinicalStatuses = clinicalStatusRows => {
  return clinicalStatusRows.map(row => ({
    model: 'ProgramRegistryClinicalStatus',
    sheetRow: row.__rowNum__,
    values: {
      id: `prcl-${row.code}`,
      ...row,
    },
  }));
};

export async function importProgramRegistry(programRegistryContext, workbook, programId) {
  const { programRegistryRecord, clinicalStatuses } = readProgramRegistryData(workbook);

  if (!programRegistryRecord) return {};

  const registryId = `pr-${programRegistryRecord.registryCode}`;
  // actually import the programRegistry to the database
  log.debug('Importing Program Registry');
  console.log(programRegistryContext);
  const stats = await importRows(programRegistryContext, {
    sheetName: 'Registry',
    rows: [
      {
        model: 'ProgramRegistry',
        sheetRow: -1,
        values: {
          id: registryId,
          programId,
          name: programRegistryRecord.registryName,
          code: programRegistryRecord.registryCode,
          visibilityStatus: programRegistryRecord.visibilityStatus,
          currentlyAtType: programRegistryRecord.currentlyAtType,
        },
      },
    ],
  });

  console.log('Importing Patient Registry Clinical statuses');
  log.debug('Importing Patient Registry Clinical statuses');
  return importRows(programRegistryContext, {
    sheetName: 'Registry',
    rows: clinicalStatuses.map(row => ({
      model: 'ProgramRegistryClinicalStatus',
      sheetRow: row.__rowNum__,
      values: {
        id: `prcl-${row.code}`,
        programRegistryId: registryId,
        ...row,
      },
    })),
    stats,
  });
}
