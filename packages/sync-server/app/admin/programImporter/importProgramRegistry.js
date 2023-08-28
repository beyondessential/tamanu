import { Op } from 'sequelize';
import { log } from 'shared/services/logging';
import { VISIBILITY_STATUSES } from '@tamanu/constants';

import { DataImportError } from '../errors';
import { importRows } from '../importRows';

import { readTwoModelTypeSheet } from './readMetadata';

function readProgramRegistryData(workbook) {
  log.debug('Reading Registry data');
  const {
    primaryRecord: registryRecord,
    secondaryRecords: clinicalStatuses,
  } = readTwoModelTypeSheet(workbook.Sheets.Registry, 'Registry');

  if (!registryRecord.registryCode) {
    throw new DataImportError('Registry', -2, 'A registry must have a code');
  }

  if (!registryRecord.registryName) {
    throw new DataImportError('Registry', -2, 'A registry must have a name');
  }

  return {
    registryRecord,
    clinicalStatuses,
  };
}

const nameIsNonUnique = (context, name, id) => {
  return context.models.ProgramRegistry.count({
    where: { name, id: { [Op.ne]: id }, visibilityStatus: VISIBILITY_STATUSES.CURRENT },
  });
};

export async function importProgramRegistry(programRegistryContext, workbook, programId) {
  // There won't always be a program registry - that's fine
  log.debug('Checking for Registry sheet');
  if (!workbook.Sheets.Registry) return {};

  const { registryRecord, clinicalStatuses } = readProgramRegistryData(workbook);
  const registryId = `pr-${registryRecord.registryCode}`;

  if (await nameIsNonUnique(programRegistryContext, registryRecord.registryName, registryId)) {
    throw new DataImportError(
      'Registry',
      -2,
      `A registry name must be unique (name: ${registryRecord.registryName})`,
    );
  }

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
          name: registryRecord.registryName,
          code: registryRecord.registryCode,
          visibilityStatus: registryRecord.visibilityStatus,
          currentlyAtType: registryRecord.currentlyAtType,
        },
      },
    ],
  });

  log.debug('Importing Patient Registry Clinical statuses');
  return importRows(programRegistryContext, {
    sheetName: 'Registry',
    rows: clinicalStatuses.map(row => ({
      model: 'ProgramRegistryClinicalStatus',
      // Note: __rowNum__ is a non-enumerable property, so needs to be accessed explicitly here
      sheetRow: row.__rowNum__,
      values: {
        id: `prClinicalStatus-${row.code}`,
        programRegistryId: registryId,
        ...row,
      },
    })),
    stats,
  });
}
