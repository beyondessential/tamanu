import { endOfDay, startOfDay } from 'date-fns';
import { getJsDateFromExcel } from 'excel-date-to-js';
import { ENCOUNTER_TYPES } from '@tamanu/constants';
import { VISIBILITY_STATUSES } from '@tamanu/constants';

function stripNotes(fields) {
  const values = { ...fields };
  delete values.note;
  return values;
}

export const loaderFactory = model => fields => [{ model, values: stripNotes(fields) }];

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

export function patientFieldDefinitionLoader(values) {
  return [
    {
      model: 'PatientFieldDefinition',
      values: {
        ...stripNotes(values),
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

export function translatedStringLoader({ stringId, ...languages }) {
  return Object.entries(languages)
    .filter(([, text]) => text.trim())
    .map(([language, text]) => ({
      model: 'TranslatedString',
      values: {
        stringId,
        language,
        text,
      },
    }));
}

export function patientDataLoader(item, { models, foreignKeySchemata }) {
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

  const predefinedPatientFields = [
    ...(Object.keys(models.Patient.rawAttributes) || []),
    ...(Object.keys(models.PatientAdditionalData.rawAttributes) || []),
  ];

  for (const definitionId of Object.keys(otherFields)) {
    // Filter only custom fields that have a value assigned to them
    // Foreign keys will not appear as they are under rawAttributes (i.e: village -> villageId)
    if (
      predefinedPatientFields.includes(definitionId) ||
      foreignKeySchemata.Patient.find(schema => schema.field === definitionId) ||
      !otherFields[definitionId]
    )
      continue;
    rows.push({
      model: 'PatientFieldValue',
      values: {
        patientId,
        definitionId,
        value: otherFields[definitionId],
      },
    });
  }

  return rows;
}

export function permissionLoader(item) {
  const { verb, noun, objectId = null, ...roles } = stripNotes(item);
  // Any non-empty value in the role cell would mean the role
  // is enabled for the permission
  return Object.entries(roles)
    .map(([role, yCell]) => [role, yCell.toLowerCase().trim()])
    .filter(([, yCell]) => yCell)
    .map(([role, yCell]) => {
      const id = `${role}-${verb}-${noun}-${objectId || 'any'}`.toLowerCase();

      const isDeleted = yCell === 'n';
      const deletedAt = isDeleted ? new Date() : null;

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

export async function userLoader(item, { models, pushError, updateStat }) {
  const { id, designations, ...otherFields } = item;
  const rows = [];

  rows.push({
    model: 'User',
    values: {
      id,
      ...otherFields,
    },
  });

  await models.UserDesignation.destroy({ where: { userId: id } });

  for (const designation of (designations || '').split(',').map(d => d.trim())) {
    if (!designation) continue;
    const existingData = await models.ReferenceData.findByPk(designation);
    if (!existingData) {
      pushError(`Designation "${designation}" does not exist`);
      continue;
    }
    if (existingData.visibilityStatus !== VISIBILITY_STATUSES.CURRENT) {
      pushError(`Designation "${designation}" doesn't has visibilityStatus of current`);
      continue;
    }
    rows.push({
      model: 'UserDesignation',
      values: {
        userId: id,
        designationId: designation,
      },
    });
  }

  return rows;
}
