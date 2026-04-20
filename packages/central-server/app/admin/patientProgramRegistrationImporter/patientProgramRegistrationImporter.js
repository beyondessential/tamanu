import { log } from '@tamanu/shared/services/logging';
import { read, readFile } from 'xlsx';

import { importPatientProgramRegistrations } from './importPatientProgramRegistrations';

export async function patientProgramRegistrationImporter({
  errors,
  models,
  stats,
  file,
  data,
  checkPermission,
}) {
  const createContext = sheetName => ({
    errors,
    log: log.child({
      file,
      sheetName,
    }),
    models,
  });

  log.info('Importing patient program registrations from file', { file });

  checkPermission('create', 'PatientProgramRegistration');
  checkPermission('create', 'PatientProgramRegistrationCondition');

  let workbook;
  if (data) {
    workbook = read(data, { type: 'buffer' });
  } else {
    workbook = readFile(file);
  }

  stats.push(
    await importPatientProgramRegistrations(
      workbook,
      createContext('Patient Program Registrations'),
    ),
  );

  log.debug('Done importing patient program registrations');
}
