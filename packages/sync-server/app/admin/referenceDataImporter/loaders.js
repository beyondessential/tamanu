import { endOfDay, startOfDay } from 'date-fns';
import { getJsDateFromExcel } from 'excel-date-to-js';
import { ENCOUNTER_TYPES } from '@tamanu/constants';

export const loaderFactory = model => ({ note, ...values }) => [{ model, values }];

export function referenceDataLoaderFactory(refType) {
  return ({ id, code, name, visibilityStatus }) => [
    {
      model: 'ReferenceData',
      values: {
        id,
        type: refType === 'diagnosis' ? 'icd10' : refType,
        code: typeof code === 'number' ? `${code}` : code,
        name,
        visibilityStatus,
      },
    },
  ];
}

export function patientFieldDefinitionLoader({ note, ...values }) {
  return [
    {
      model: 'PatientFieldDefinition',
      values: {
        ...values,
        options: (values.options || '')
          .split(',')
          .map(v => v.trim())
          .filter(v => v !== ''),
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
  const { dateOfBirth, id: patientId, patientAdditionalData, ...otherFields } = item;

  const rows = [];

  rows.push({
    model: 'Patient',
    values: {
      id: patientId,
      dateOfBirth: dateOfBirth && getJsDateFromExcel(dateOfBirth),
      ...otherFields,
    },
  });

  if (patientAdditionalData?.toString().toUpperCase() === 'TRUE') {
    rows.push({
      model: 'PatientAdditionalData',
      values: {
        patientId,
        ...otherFields,
      },
    });
  }

  return rows;
}

export function permissionLoader(item) {
  const { verb, noun, objectId = null, note, ...roles } = item;
  // Any non-empty value in the role cell would mean the role
  // is enabled for the permission
  return Object.entries(roles)
    .map(([role, yCell]) => [role, yCell.toLowerCase().trim()])
    .filter(([, yCell]) => yCell)
    .map(([role, yCell]) => {
      const id = `${role}-${verb}-${noun}-${objectId || 'any'}`.toLowerCase();

      // set deletedAt if the cell is marked N
      const deletedAt = yCell === 'n' ? new Date() : null;

      return {
        model: 'Permission',
        values: {
          _yCell: yCell,
          id,
          verb,
          noun,
          objectId,
          role,
          deletedAt,
        },
      };
    });
}

export function labTestPanelLoader(item) {
  const { id, testTypesInPanel, ...otherFields } = item;
  const rows = [];

  rows.push({
    model: 'LabTestPanel',
    values: {
      id,
      ...otherFields,
    },
  });

  (testTypesInPanel || '')
    .split(',')
    .map(t => t.trim())
    .forEach(testType => {
      rows.push({
        model: 'LabTestPanelLabTestTypes',
        values: {
          id: `${id};${testType}`,
          labTestPanelId: id,
          labTestTypeId: testType,
        },
      });
    });

  return rows;
}
