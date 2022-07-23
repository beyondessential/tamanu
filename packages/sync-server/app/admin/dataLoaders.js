import { getJsDateFromExcel } from 'excel-date-to-js';
import moment from 'moment';
import { ENCOUNTER_TYPES } from 'shared/constants';

export const loaderFactory = model => ({ note, ...values }) => ({ model, values });
export function referenceDataLoaderFactory(refType) {
  return ({ id, code, name }) => [
    {
      model: 'ReferenceData',
      values: {
        id,
        type: refType,
        code: typeof code === 'number' ? `${code}` : code,
        name,
      },
    },
  ];
}
export function administeredVaccineLoader(item) {
  const {
    encounterId, administeredVaccineId, date: excelDate, reason, consent, locationId, departmentId, examinerId, patientId, ...data
  } = item;
  const date = excelDate ? getJsDateFromExcel(excelDate) : null;

  const rows = [];

  rows.push({
    model: 'AdministeredVaccine',
    values: {
      id: administeredVaccineId,

      date,
      reason,
      consent: ['true', 'yes', 't', 'y'].some(v => v === consent?.toLowerCase()),
      ...data,

      // relationships
      encounterId,
    },
  });

  const startDate = date ? moment(date).startOf('day') : null;
  const endDate = date ? moment(date).endOf('day') : null;
  rows.push({
    model: Encounter,
    values: {
      id: encounterId,

      encounterType: ENCOUNTER_TYPES.CLINIC,
      startDate,
      endDate,
      reasonForEncounter: reason,

      // relationships
      administeredVaccines: [administeredVaccineId],
      locationId,
      departmentId,
      examinerId,
      patientId,
    },
  });

  return rows;
}
export function patientDataLoader(item) {
  const { dateOfBirth, id: patientId, patientAdditionalDataId, ...otherFields } = item;

  const rows = [];

  rows.push({
    model: 'Patient',
    values: {
      id: patientId,
      dateOfBirth: dateOfBirth && getJsDateFromExcel(dateOfBirth),
      ...otherFields,
    },
  });

  if (patientAdditionalDataId) {
    rows.push({
      model: 'PatientAdditionalData',
      values: {
        id: patientAdditionalDataId,
        patientId,
        ...otherFields,
      },
    });
  }

  return rows;
}
