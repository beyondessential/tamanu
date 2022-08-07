import { endOfDay, startOfDay } from 'date-fns';
import { getJsDateFromExcel } from 'excel-date-to-js';
import { ENCOUNTER_TYPES } from 'shared/constants';

export const loaderFactory = model => ({ note, ...values }) => [{ model, values }];

export function referenceDataLoaderFactory(refType) {
  if (refType === 'diagnosis') refType = 'icd10';
  return ({ id, code, name, visibilityStatus }) => [
    {
      model: 'ReferenceData',
      values: {
        id,
        type: refType,
        code: typeof code === 'number' ? `${code}` : code,
        name,
        visibilityStatus,
      },
    },
  ];
}

export function administeredVaccineLoader(item) {
  const {
    encounterId,
    administeredVaccineId,
    date: excelDate,
    reason,
    consent,
    locationId,
    departmentId,
    examinerId,
    patientId,
    ...data
  } = item;
  const date = excelDate ? getJsDateFromExcel(excelDate) : null;

  const startDate = date ? startOfDay(date) : null;
  const endDate = date ? endOfDay(date) : null;

  return [
    {
      model: 'Encounter',
      values: {
        id: encounterId,

        encounterType: ENCOUNTER_TYPES.CLINIC,
        startDate,
        endDate,
        reasonForEncounter: reason,

        locationId,
        departmentId,
        examinerId,
        patientId,
      },
    },
    {
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
    },
  ];
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
