import { endOfDay, startOfDay } from 'date-fns';
import { getJsDateFromExcel } from 'excel-date-to-js';
import { Op } from 'sequelize';
import {
  ENCOUNTER_TYPES,
  VISIBILITY_STATUSES,
  PATIENT_FIELD_DEFINITION_TYPES,
  REFERENCE_DATA_RELATION_TYPES,
  REFERENCE_TYPES,
  NOUNS_WITH_OBJECT_ID,
  DEFAULT_LANGUAGE_CODE,
  INVOICE_ITEMS_CATEGORIES,
  INVOICE_ITEMS_CATEGORIES_MODELS,
} from '@tamanu/constants';
import { v4 as uuidv4 } from 'uuid';
import { pluralize } from 'inflection';
import { isEmpty, isNil } from 'lodash';
import { GENERIC_SURVEY_EXPORT_REPORT_ID, REPORT_DEFINITIONS } from '@tamanu/shared/reports';

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

export async function translatedStringLoader(item, { models, header }) {
  const { stringId, ...languages } = stripNotes(item);
  const rows = [];
  const languagesInSheet = header.filter(h => h !== 'stringId');
  const existingTranslations = await models.TranslatedString.findAll({
    where: { stringId, language: languagesInSheet },
  });
  const existingTranslationsMap = new Map(existingTranslations.map(t => [t.language, t]));
  for (const language of languagesInSheet) {
    if (language === DEFAULT_LANGUAGE_CODE) {
      continue; // Ignore any edits to the default language
    }

    const text = languages[language];
    const emptyCell = isNil(text) || isEmpty(`${text}`.trim());
    if (emptyCell) {
      const existing = existingTranslationsMap.get(language);
      if (existing) {
        // An empty cell means delete the translation for this language
        rows.push({
          model: 'TranslatedString',
          values: {
            stringId,
            language,
            deletedAt: new Date(),
          },
        });
      }
      continue;
    }

    rows.push({
      model: 'TranslatedString',
      values: {
        stringId,
        language,
        text,
      },
    });
  }

  return rows;
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

async function validateObjectId(item, models, pushError) {
  const { noun, objectId } = item;
  if (!objectId || !noun || !NOUNS_WITH_OBJECT_ID.includes(noun)) {
    return;
  }

  if (noun === 'StaticReport') {
    const allowedReportIds = [
      ...GENERIC_SURVEY_EXPORT_REPORT_ID,
      ...REPORT_DEFINITIONS.map(({ id }) => id),
    ];
    const objectIds = objectId.split('/');
    for (const objectId of objectIds) {
      if (!allowedReportIds.includes(objectId)) {
        pushError(`Invalid objectId: ${objectId} for noun: ${noun}`);
      }
    }
    return;
  }

  // Skip strict objectId validation in test environments
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const record = await models[noun].findByPk(objectId);
  if (!record) {
    pushError(`Invalid objectId: ${objectId} for noun: ${noun}`);
  }
}

export async function permissionLoader(item, { models, pushError }) {
  const { verb, noun, objectId = null, ...roles } = stripNotes(item);

  const normalizedObjectId = objectId && objectId.trim() !== '' ? objectId : null;
  const normalizedVerb = verb.trim();
  const normalizedNoun = noun.trim();

  await validateObjectId(
    { ...item, noun: normalizedNoun, objectId: normalizedObjectId },
    models,
    message => pushError(message, 'Permission'),
  );

  // Any non-empty value in the role cell would mean the role
  // is enabled for the permission
  return Object.entries(roles)
    .map(([role, yCell]) => [role, yCell.toLowerCase().trim()])
    .filter(([, yCell]) => yCell)
    .map(([role, yCell]) => {
      const id =
        `${role}-${normalizedVerb}-${normalizedNoun}-${normalizedObjectId || 'any'}`.toLowerCase();

      const isDeleted = yCell === 'n';
      const deletedAt = isDeleted ? new Date() : null;

      return {
        model: 'Permission',
        values: {
          _yCell: yCell,
          id,
          verb: normalizedVerb,
          noun: normalizedNoun,
          objectId: normalizedObjectId,
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
    .forEach((testType, index) => {
      rows.push({
        model: 'LabTestPanelLabTestTypes',
        values: {
          id: `${id};${testType}`,
          labTestPanelId: id,
          labTestTypeId: testType,
          order: index,
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
    pushError(`Tasks ${nonExistentTaskIds.join(', ')} not found`, 'TaskSet');
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
      pushError(`Designation "${designation}" does not exist`, 'User');
      continue;
    }
    if (existingData.visibilityStatus !== VISIBILITY_STATUSES.CURRENT) {
      pushError(`Designation "${designation}" doesn't have visibilityStatus of current`, 'User');
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

  const [frequencyValue, frequencyUnit] = taskFrequency?.trim().split(' ') || [];

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

  const existingDesignationIds = await models.ReferenceData.findByIds(designationIds).then(
    designations => designations.map(d => d.id),
  );
  for (const designationId of designationIds) {
    if (!existingDesignationIds.includes(designationId)) {
      pushError(`Designation "${designationId}" does not exist`, 'TaskTemplate');
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

export async function drugLoader(item, { models }) {
  const { id: drugId, route, units, notes, isSensitive = false } = item;
  const rows = [];

  let existingDrug;
  if (drugId) {
    existingDrug = await models.ReferenceDrug.findOne({
      where: { referenceDataId: drugId },
    });
  }

  const newDrug = {
    id: existingDrug?.id || uuidv4(),
    referenceDataId: drugId,
    route,
    units,
    notes,
    isSensitive,
  };
  rows.push({
    model: 'ReferenceDrug',
    values: newDrug,
  });

  return rows;
}

export async function medicationTemplateLoader(item, { models, pushError }) {
  const {
    id: referenceDataId,
    medication: drugReferenceDataId,
    prnMedication,
    doseAmount,
    units,
    frequency,
    route,
    duration,
    notes,
    dischargeQuantity,
    ongoingMedication,
  } = item;

  const rows = [];

  const drug = await models.ReferenceData.findOne({
    where: { id: drugReferenceDataId, type: REFERENCE_TYPES.DRUG },
  });
  if (!drug) {
    pushError(
      `Drug with ID "${drugReferenceDataId}" does not exist.`,
      'ReferenceMedicationTemplate',
    );
  }

  if (isNaN(doseAmount) && doseAmount?.toString().toLowerCase() !== 'variable') {
    pushError(
      `Dose amount must be a number or the string "variable".`,
      'ReferenceMedicationTemplate',
    );
  }

  const existingTemplate = await models.ReferenceMedicationTemplate.findOne({
    where: { referenceDataId },
  });

  const [durationValue, durationUnit] = duration?.toString()?.split(' ') || [];

  const newTemplate = {
    id: existingTemplate?.id || uuidv4(),
    referenceDataId,
    medicationId: drugReferenceDataId,
    isPrn: prnMedication,
    isVariableDose: doseAmount?.toString().toLowerCase() === 'variable',
    doseAmount: parseFloat(doseAmount) || null,
    units,
    frequency,
    route,
    durationValue: durationValue || null,
    durationUnit: durationUnit ? pluralize(durationUnit).toLowerCase() : null,
    notes: notes || null,
    dischargeQuantity: dischargeQuantity || null,
    isOngoing: ongoingMedication,
  };

  rows.push({
    model: 'ReferenceMedicationTemplate',
    values: newTemplate,
  });

  return rows;
}

export async function medicationSetLoader(item, { models, pushError }) {
  const { id, medicationTemplates: medicationTemplateIdsString } = stripNotes(item);

  const rows = [];

  const medicationTemplateIds = (medicationTemplateIdsString || '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean);

  const duplicateIds = medicationTemplateIds.filter(
    (templateId, index) => medicationTemplateIds.indexOf(templateId) !== index,
  );

  if (duplicateIds.length > 0) {
    const uniqueDuplicates = [...new Set(duplicateIds)];
    pushError(
      `Duplicate medication template IDs found in medication set "${id}": ${uniqueDuplicates.join(', ')}.`,
    );
  }

  let existingTemplateIds = [];
  if (medicationTemplateIds.length > 0) {
    const existingTemplates = await models.ReferenceData.findAll({
      where: {
        id: { [Op.in]: medicationTemplateIds },
        type: REFERENCE_TYPES.MEDICATION_TEMPLATE,
      },
    });
    existingTemplateIds = existingTemplates.map(({ id }) => id);

    const nonExistentTemplateIds = medicationTemplateIds.filter(
      id => !existingTemplateIds.includes(id),
    );
    if (nonExistentTemplateIds.length > 0) {
      pushError(
        `Medication Templates ${nonExistentTemplateIds.join(', ')} for set "${id}" not found or not of type MEDICATION_TEMPLATE.`,
      );
    }
  }

  // Remove relations for templates no longer in the set
  await models.ReferenceDataRelation.destroy({
    where: {
      referenceDataParentId: id,
      type: REFERENCE_DATA_RELATION_TYPES.MEDICATION,
      referenceDataId: { [Op.notIn]: existingTemplateIds },
    },
  });

  // Upsert relations for templates in the set
  for (const templateId of existingTemplateIds) {
    rows.push({
      model: 'ReferenceDataRelation',
      values: {
        referenceDataParentId: id,
        referenceDataId: templateId,
        type: REFERENCE_DATA_RELATION_TYPES.MEDICATION,
      },
    });
  }

  return rows;
}

export async function procedureTypeLoader(item, { models, pushError }) {
  const { id, formLink } = item;
  const rows = [];

  const surveyIdList = formLink ? formLink.split(',').map(s => s.trim()) : [];

  // Validate that all surveys exist before creating relationships
  if (surveyIdList.length > 0) {
    const existingSurveys = await models.Survey.findAll({
      where: { id: { [Op.in]: surveyIdList } },
    });
    const existingSurveyIds = existingSurveys.map(({ id }) => id);
    const nonExistentSurveyIds = surveyIdList.filter(
      surveyId => !existingSurveyIds.includes(surveyId),
    );
    if (nonExistentSurveyIds.length > 0) {
      pushError(
        `Linked survey${nonExistentSurveyIds.length > 1 ? 's' : ''} "${nonExistentSurveyIds.join(', ')}" for procedure type "${id}" not found.`,
        'ProcedureTypeSurvey',
      );
    }

    // Check if any of the existing surveys have survey_type !== 'programs'
    const nonProgramSurveys = existingSurveys.filter(survey => survey.surveyType !== 'programs');
    if (nonProgramSurveys.length > 0) {
      pushError(
        `Survey${nonProgramSurveys.length > 1 ? 's' : ''} "${nonProgramSurveys.map(s => s.id).join(', ')}" for procedure type "${id}" must have survey_type of 'programs'.`,
        'ProcedureTypeSurvey',
      );
    }
  }

  const existingProcedureType = await models.ReferenceData.findByPk(id, {
    include: [{ model: models.Survey, as: 'surveys' }],
  });

  if (existingProcedureType) {
    const idsToBeDeleted = existingProcedureType.surveys
      .map(s => s.id)
      .filter(surveyId => !surveyIdList.includes(surveyId));

    if (idsToBeDeleted.length > 0) {
      idsToBeDeleted.forEach(surveyId => {
        rows.push({
          model: 'ProcedureTypeSurvey',
          values: {
            procedureTypeId: id,
            surveyId: surveyId,
            deletedAt: new Date(),
          },
        });
      });
    }
  }

  surveyIdList.forEach(surveyId => {
    rows.push({
      model: 'ProcedureTypeSurvey',
      values: {
        procedureTypeId: id,
        surveyId: surveyId,
      },
    });
  });

  return rows;
}

export async function invoiceProductLoader(item, { models, pushError }) {
  const { category, sourceRecordId } = item;
  const rows = [];

  if (!category && sourceRecordId) {
    pushError(`Must provide a category if providing a sourceRecordId.`, 'InvoiceProduct');
    return [];
  }

  if (category && !sourceRecordId) {
    pushError(`Must provide a sourceRecordId if providing a category.`, 'InvoiceProduct');
    return [];
  }

  if (!category && !sourceRecordId) {
    return [
      {
        model: 'InvoiceProduct',
        values: {
          id: uuidv4(),
          ...item,
        },
      },
    ];
  }

  const validCategories = Object.values(INVOICE_ITEMS_CATEGORIES);
  if (!validCategories.includes(category)) {
    pushError(
      `Invalid category: "${category}". Must be one of: ${validCategories.join(', ')}.`,
      'InvoiceProduct',
    );
    return [];
  }

  const modelName = INVOICE_ITEMS_CATEGORIES_MODELS[category];
  if (!modelName) {
    pushError(`No model mapped to category: "${category}".`, 'InvoiceProduct');
    return [];
  }

  const model = models[modelName];
  if (!model) {
    pushError(`Model not found: "${modelName}".`, 'InvoiceProduct');
    return [];
  }

  const existingRecord = await model.findOne({
    where: { id: sourceRecordId },
  });
  if (!existingRecord) {
    pushError(
      `Source record with ID "${sourceRecordId}" and category "${category}" does not exist.`,
      'InvoiceProduct',
    );
    return [];
  }

  const newInvoiceProduct = {
    id: uuidv4(),
    ...item,
    category,
    sourceRecordId,
  };
  rows.push({
    model: 'InvoiceProduct',
    values: newInvoiceProduct,
  });

  return rows;
}
