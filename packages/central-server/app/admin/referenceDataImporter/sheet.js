import { utils } from 'xlsx';

import {
  PATIENT_FIELD_DEFINITION_TYPES,
  REFERENCE_TYPES,
  REFERENCE_TYPE_VALUES,
} from '@tamanu/constants';
import { DataLoaderError, ValidationError, WorkSheetError } from '../errors';
import { statkey, updateStat } from '../stats';
import { importRows } from '../importRows';

const FOREIGN_KEY_SCHEMATA = {
  CertifiableVaccine: [
    {
      field: 'vaccine',
      model: 'ReferenceData',
      types: ['vaccine', 'drug'],
    },
    {
      field: 'manufacturer',
      model: 'ReferenceData',
      types: ['manufacturer'],
    },
  ],
  Department: [
    {
      field: 'facility',
      model: 'Facility',
    },
  ],
  Facility: [
    {
      field: 'catchment',
      model: 'ReferenceData',
      types: ['catchment'],
    },
  ],
  LabTestType: [
    {
      field: 'labTestCategory',
      model: 'ReferenceData',
      types: ['labTestCategory'],
    },
  ],
  Location: [
    {
      field: 'facility',
      model: 'Facility',
    },
  ],
  Patient: [
    {
      field: 'village',
      model: 'ReferenceData',
      types: ['village'],
    },
  ],
  Permission: [
    {
      field: 'role',
      model: 'Role',
    },
  ],
  ScheduledVaccine: [
    {
      field: 'vaccine',
      model: 'ReferenceData',
      types: ['vaccine', 'drug'],
    },
  ],
  ReferenceDataRelation: [
    {
      field: 'referenceData',
      model: 'ReferenceData',
      types: REFERENCE_TYPE_VALUES,
    },
    {
      field: 'referenceDataParent',
      model: 'ReferenceData',
      types: REFERENCE_TYPE_VALUES,
    },
  ],
};

const patientFieldDefinitionValidator = async ({ values, models }) => {
  const existingDefinition =
    values?.definitionId &&
    (await models.PatientFieldDefinition.findOne({ where: { id: values.definitionId } }));

  if (!existingDefinition)
    throw new Error(`No such patient field definition: ${values?.definitionId}`);

  if (
    existingDefinition.fieldType === PATIENT_FIELD_DEFINITION_TYPES.NUMBER &&
    values.value &&
    isNaN(values.value)
  )
    throw new Error(`Field Type mismatch: expected field type is a number value`);

  if (
    existingDefinition.fieldType === PATIENT_FIELD_DEFINITION_TYPES.SELECT &&
    values.value &&
    !existingDefinition.options.includes(values.value)
  )
    throw new Error(
      `Field Type mismatch: expected value to be one of "${existingDefinition.options.join(', ')}"`,
    );
};

const referenceDataValidator = async ({
  values,
  sheetName,
  sheetRow,
  nameCache,
  errors,
}) => {
  if (values.name) {
    if (!nameCache.has(sheetName)) {
      nameCache.set(sheetName, new Set());
    }

    const referenceDataNameCache = nameCache.get(sheetName);

    if (referenceDataNameCache.has(values.name)) {
      errors.push(
        new ValidationError(
          sheetName,
          sheetRow,
          `Duplicate name in selected file for type "${sheetName}": ${values.name}`,
        ),
      );
      return false;
    }

    referenceDataNameCache.add(values.name);
  }
  return true;
};

const validationHandlers = {
  PatientFieldValue: patientFieldDefinitionValidator,
  ReferenceData: referenceDataValidator,
};

export async function importSheet({ errors, log, models }, { loader, sheetName, sheet }) {
  const stats = {};

  log.debug('Loading rows from sheet');
  let sheetRows;
  try {
    sheetRows = utils.sheet_to_json(sheet);
  } catch (err) {
    errors.push(new WorkSheetError(sheetName, 0, err));
    return stats;
  }

  if (sheetRows.length === 0) {
    log.debug('Nothing in this sheet, skipping');
    return stats;
  }

  log.debug('Preparing rows of data into table rows', { rows: sheetRows.length });
  const tableRows = [];
  const idCache = new Set();
  const nameCache = new Map();

  for (const [sheetRow, data] of sheetRows.entries()) {
    const trimmed = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key.trim(), value]),
    );
    try {
      for (const { model, values } of loader(trimmed, models, FOREIGN_KEY_SCHEMATA)) {
        if (!models[model]) throw new Error(`No such type of data: ${model}`);

        if (validationHandlers[model]) {
          const isValid = await validationHandlers[model]({
            values,
            models,
            sheetName,
            sheetRow,
            nameCache,
            errors,
          });
          if (!isValid) continue;
        }

        if (values.id && idCache.has(values.id)) {
          errors.push(new ValidationError(sheetName, sheetRow, `duplicate id: ${values.id}`));
          continue;
        } else {
          idCache.add(values.id);
        }

        updateStat(stats, statkey(model, sheetName), 'created', 0);
        tableRows.push({ model, sheetRow, values });
      }
    } catch (err) {
      errors.push(new DataLoaderError(sheetName, sheetRow, err));
    }
  }

  await importRows(
    { errors, log, models },
    { rows: tableRows, sheetName, stats, foreignKeySchemata: FOREIGN_KEY_SCHEMATA },
  );

  return stats;
}
