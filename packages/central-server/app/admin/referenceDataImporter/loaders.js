import { endOfDay, startOfDay } from 'date-fns';
import { getJsDateFromExcel } from 'excel-date-to-js';
import { Op } from 'sequelize';
import {
  ENCOUNTER_TYPES,
  VISIBILITY_STATUSES,
  PATIENT_FIELD_DEFINITION_TYPES,
  REFERENCE_DATA_RELATION_TYPES,
} from '@tamanu/constants';
import { v4 as uuidv4 } from 'uuid';

function stripNotes(fields) {
  const values = { ...fields };
  delete values.note;
  return values;
}

export const loaderFactory = model => fields => [{ model, values: stripNotes(fields) }];

export function referenceDataLoaderFactory(type) {
  return ({ id, code, name, visibilityStatus }) => [
    {
      model: 'ReferenceData',
      values: {
        id,
        type,
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

export function translatedStringLoader(item) {
  const { stringId, ...languages } = stripNotes(item);
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

export async function patientDataLoader(item, { models, foreignKeySchemata }) {
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
    const value = otherFields[definitionId];

    // Filter only custom fields that have a value assigned to them
    // Foreign keys will not appear as they are under rawAttributes (i.e: village -> villageId)
    if (
      predefinedPatientFields.includes(definitionId) ||
      foreignKeySchemata.Patient.find(schema => schema.field === definitionId) ||
      !value
    )
      continue;

    const existingDefinition = await models.PatientFieldDefinition.findOne({
      where: { id: definitionId },
    });
    if (!existingDefinition) {
      throw new Error(`No such patient field definition: ${definitionId}`);
    }
    if (existingDefinition.fieldType === PATIENT_FIELD_DEFINITION_TYPES.NUMBER && isNaN(value)) {
      throw new Error(
        `Field Type mismatch: expected field type is a number value for "${definitionId}"`,
      );
    }
    if (
      existingDefinition.fieldType === PATIENT_FIELD_DEFINITION_TYPES.SELECT &&
      !existingDefinition.options.includes(value)
    ) {
      throw new Error(
        `Field Type mismatch: expected value to be one of "${existingDefinition.options.join(
          ', ',
        )}" for ${definitionId}`,
      );
    }

    rows.push({
      model: 'PatientFieldValue',
      values: {
        patientId,
        definitionId,
        value,
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

export const taskSetLoader = async (item, { models, pushError }) => {
  const { id: taskSetId, tasks: taskIdsString } = item;
  const taskIds = taskIdsString
    .split(',')
    .map(taskId => taskId.trim())
    .filter(Boolean);

  const existingTaskIds = await models.ReferenceData.findAll({
    where: { id: { [Op.in]: taskIds } },
  }).then(tasks => tasks.map(({ id }) => id));
  const nonExistentTaskIds = taskIds.filter(taskId => !existingTaskIds.includes(taskId));
  if (nonExistentTaskIds.length > 0) {
    pushError(`Tasks ${nonExistentTaskIds.join(', ')} not found`);
  }

  if (!existingTaskIds.length) return [];

  // Remove any tasks that are not in task set
  await models.ReferenceDataRelation.destroy({
    where: {
      referenceDataParentId: taskSetId,
      type: REFERENCE_DATA_RELATION_TYPES.TASK,
      referenceDataId: { [Op.notIn]: taskIds },
    },
  });

  // Upsert tasks that are in task set
  const rows = existingTaskIds.map(taskId => ({
    model: 'ReferenceDataRelation',
    values: {
      referenceDataId: taskId,
      referenceDataParentId: taskSetId,
      type: REFERENCE_DATA_RELATION_TYPES.TASK,
    },
  }));

  return rows;
};

export async function userLoader(item, { models, pushError }) {
  const { id, allowedFacilities, designations, ...otherFields } = item;
  const rows = [];

  const allowedFacilityIds = allowedFacilities
    ? allowedFacilities.split(',').map(t => t.trim())
    : [];

  rows.push({
    model: 'User',
    values: {
      id,
      ...otherFields,
    },
    allowedFacilityIds,
  });

  const existingUser = await models.User.findByPk(id, {
    include: [{ model: models.Facility, as: 'facilities' }],
  });

  if (existingUser) {
    const idsToBeDeleted = existingUser.facilities
      .map(f => f.id)
      .filter(id => !allowedFacilityIds.includes(id));

    idsToBeDeleted.forEach(facilityId => {
      rows.push({
        model: 'UserFacility',
        values: {
          id: `${id};${facilityId}`,
          userId: id,
          facilityId: facilityId,
          deletedAt: new Date(),
        },
      });
    });
  }

  allowedFacilityIds.forEach(facilityId => {
    rows.push({
      model: 'UserFacility',
      values: {
        id: `${id};${facilityId}`,
        userId: id,
        facilityId: facilityId,
      },
    });
  });

  const designationIds = (designations || '')
    .split(',')
    .map(d => d.trim())
    .filter(Boolean);

  if (id) {
    await models.UserDesignation.destroy({
      where: { userId: id, designationId: { [Op.notIn]: designationIds } },
    });
  }

  for (const designation of designationIds) {
    const existingData = await models.ReferenceData.findByPk(designation);
    if (!existingData) {
      pushError(`Designation "${designation}" does not exist`);
      continue;
    }
    if (existingData.visibilityStatus !== VISIBILITY_STATUSES.CURRENT) {
      pushError(`Designation "${designation}" doesn't have visibilityStatus of current`);
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

export async function taskTemplateLoader(item, { models, pushError }) {
  const { id: taskId, assignedTo, taskFrequency, highPriority } = item;
  const rows = [];

  let frequencyValue, frequencyUnit;
  if (taskFrequency?.trim()) {
    try {
      frequencyValue = taskFrequency.trim().split(' ')[0];
      frequencyUnit = taskFrequency.trim().split(' ')[1];
    } catch (e) {
      pushError(`Invalid task frequency ${taskFrequency}: ${e.message}`);
    }
  }

  let existingTaskTemplate;
  if (taskId) {
    existingTaskTemplate = await models.TaskTemplate.findOne({
      where: { referenceDataId: taskId },
    });
  }

  const newTaskTemplate = {
    id: existingTaskTemplate?.id || uuidv4(),
    referenceDataId: taskId,
    frequencyValue,
    frequencyUnit,
    highPriority,
  };
  rows.push({
    model: 'TaskTemplate',
    values: newTaskTemplate,
  });

  const designationIds = (assignedTo || '')
    .split(',')
    .map(d => d.trim())
    .filter(Boolean);

  await models.TaskTemplateDesignation.destroy({
    where: { taskTemplateId: newTaskTemplate.id, designationId: { [Op.notIn]: designationIds } },
  });

  const existingDesignationIds = await models.ReferenceData.findByIds(
    designationIds,
  ).then(designations => designations.map(d => d.id));
  for (const designationId of designationIds) {
    if (!existingDesignationIds.includes(designationId)) {
      pushError(`Designation "${designationId}" does not exist`);
      continue;
    }
    rows.push({
      model: 'TaskTemplateDesignation',
      values: {
        taskTemplateId: newTaskTemplate.id,
        designationId,
      },
    });
  }

  return rows;
}
