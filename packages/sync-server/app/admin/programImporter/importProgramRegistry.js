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

const ensureUniqueName = async (context, registryName, registryId) => {
  const conflictingRegistry = await context.models.ProgramRegistry.findOne({
    where: {
      name: registryName,
      id: { [Op.ne]: registryId },
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    },
  });
  if (conflictingRegistry) {
    throw new DataImportError(
      'Registry',
      -2,
      `A registry name must be unique (name: ${registryName}, conflicting code: ${conflictingRegistry.code})`,
    );
  }
};

const ensureCurrentlyAtUpdateIsAllowed = async (context, currentlyAtType, registryId) => {
  const existingRegistry = await context.models.ProgramRegistry.findByPk(registryId);
  // No validation on first import
  if (!existingRegistry) return;

  // No validation if we aren't trying to change the currentlyAtType
  if (!currentlyAtType || currentlyAtType === existingRegistry.currentlyAtType) return;

  const existingData = await context.models.PatientProgramRegistration.findOne({
    where: {
      programRegistryId: registryId,
      [Op.or]: {
        facilityId: { [Op.not]: null },
        villageId: { [Op.not]: null },
      },
    },
  });

  if (existingData) {
    throw new DataImportError(
      'Registry',
      -2,
      `Cannot update the currentlyAtType of a program registry with existing data`,
    );
  }
};

export async function importProgramRegistry(context, workbook, programId) {
  // There won't always be a program registry - that's fine
  log.debug('Checking for Registry sheet');
  if (!workbook.Sheets.Registry) return {};

  const { registryRecord, clinicalStatuses } = readProgramRegistryData(workbook);
  const { registryName, currentlyAtType } = registryRecord;
  const registryId = `programRegistry-${registryRecord.registryCode}`;

  await ensureUniqueName(context, registryName, registryId);
  await ensureCurrentlyAtUpdateIsAllowed(context, currentlyAtType, registryId);

  log.debug('Importing Program Registry');
  const stats = await importRows(context, {
    sheetName: 'Registry',
    rows: [
      {
        model: 'ProgramRegistry',
        sheetRow: -2,
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
  return importRows(context, {
    sheetName: 'Registry',
    rows: clinicalStatuses.map(row => ({
      model: 'ProgramRegistryClinicalStatus',
      // Note: __rowNum__ is a non-enumerable property, so needs to be accessed explicitly here
      // -1 as it'll have 2 added to it later but it's only 1 off
      sheetRow: row.__rowNum__ - 1,
      values: {
        id: `prClinicalStatus-${row.code}`,
        programRegistryId: registryId,
        ...row,
      },
    })),
    stats,
  });
}
