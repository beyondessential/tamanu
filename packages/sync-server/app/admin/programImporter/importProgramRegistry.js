import { log } from 'shared/services/logging';
import { DataImportError } from '../errors';
import { importRows } from '../importRows';

import { readTwoModelTypeSheet } from './readMetadata';

function readProgramRegistryData(workbook) {
  log.debug('Reading Registry data');
  const {
    primaryRecord: programRegistryRecord,
    secondaryRecords: clinicalStatuses,
  } = readTwoModelTypeSheet(workbook.Sheets.Registry, 'Registry');

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

export async function importProgramRegistry(programRegistryContext, workbook, programId) {
  // There won't always be a program registry - that's fine
  log.debug('Checking for Registry sheet');
  if (!workbook.Sheets.Registry) return {};

  const { programRegistryRecord, clinicalStatuses } = readProgramRegistryData(workbook);

  const registryId = `pr-${programRegistryRecord.registryCode}`;

  log.debug('Importing Program Registry');
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
