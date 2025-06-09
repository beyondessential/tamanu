import { camelCase, lowerCase, lowerFirst, startCase, upperFirst } from 'lodash';
import { Op } from 'sequelize';
import { ValidationError as YupValidationError } from 'yup';
import config from 'config';
import {
  TRANSLATABLE_REFERENCE_TYPES,
  REFERENCE_DATA_TRANSLATION_PREFIX,
  DEFAULT_LANGUAGE_CODE,
} from '@tamanu/constants';

import { normaliseSheetName } from './importerEndpoint';
import { ForeignkeyResolutionError, UpsertionError, ValidationError } from '../errors';
import { statkey, updateStat } from '../stats';
import * as schemas from '../importSchemas';
import { validateTableRows } from './validateTableRows';

function findFieldName(values, fkField) {
  const fkFieldLower = fkField.toLowerCase();
  const fkFieldCamel = camelCase(fkField);
  const fkFieldUcfirst = upperFirst(fkField);
  const fkFieldSplit = lowerCase(fkField);
  const fkFieldSplitUcwords = startCase(fkFieldSplit);
  if (values[fkField]) return fkField;
  if (values[fkFieldLower]) return fkFieldLower;
  if (values[fkFieldCamel]) return fkFieldCamel;
  if (values[fkFieldUcfirst]) return fkFieldUcfirst;
  if (values[fkFieldSplit]) return fkFieldSplit;
  if (values[fkFieldSplitUcwords]) return fkFieldSplitUcwords;
  return null;
}

// Some models require special logic to fetch find the existing record for a given set of values
const existingRecordLoaders = {
  // most models can just do a simple ID lookup
  default: (Model, { id }) => Model.findByPk(id, { paranoid: false }),
  // User requires the password field to be explicitly scoped in
  User: (User, { id }) => User.scope('withPassword').findByPk(id, { paranoid: false }),
  PatientAdditionalData: (PAD, { patientId }) => PAD.findByPk(patientId, { paranoid: false }),
  // PatientFieldValue model has a composite PK that uses patientId & definitionId
  PatientFieldValue: (PFV, { patientId, definitionId }) =>
    PFV.findOne({ where: { patientId, definitionId } }, { paranoid: false }),
  // TranslatedString model has a composite PK that uses stringId & language
  TranslatedString: (TS, { stringId, language }) =>
    TS.findOne({ where: { stringId, language } }, { paranoid: false }),
  ReferenceDataRelation: (RDR, { referenceDataId, referenceDataParentId, type }) =>
    RDR.findOne({ where: { referenceDataId, referenceDataParentId, type } }, { paranoid: false }),
  TaskTemplateDesignation: (TTD, { taskTemplateId, designationId }) =>
    TTD.findOne({ where: { taskTemplateId, designationId } }, { paranoid: false }),
  UserDesignation: (UD, { userId, designationId }) =>
    UD.findOne({ where: { userId, designationId } }, { paranoid: false }),
};

function loadExisting(Model, values) {
  const loader = existingRecordLoaders[Model.name] || existingRecordLoaders.default;
  return loader(Model, values);
}

function extractRecordName(values, dataType) {
  if (dataType === 'scheduledVaccine') return values.label;
  return values.name;
}

export async function importRows(
  { errors, log, models },
  { rows, sheetName, stats: previousStats = {}, foreignKeySchemata = {}, skipExisting = false },
  validationContext = {},
) {
  const stats = { ...previousStats };

  log.debug('Importing rows to database', { count: rows.length });
  if (rows.length === 0) {
    log.debug('Nothing to do, skipping');
    return stats;
  }

  log.debug('Building reverse lookup table');
  const lookup = new Map();
  for (const {
    model,
    values: { id, type = null, name = null },
  } of rows) {
    if (!id) continue;
    const kind = model === 'ReferenceData' ? type : model;
    lookup.set(`kind.${kind}-id.${id}`, null);
    if (name) lookup.set(`kind.${kind}-name.${name.toLowerCase()}`, id);
  }

  log.debug('Resolving foreign keys', { rows: rows.length });
  const resolvedRows = [];
  for (const { model, sheetRow, values } of rows) {
    try {
      for (const fkSchema of foreignKeySchemata[model] ?? []) {
        const fkFieldName = findFieldName(values, fkSchema.field);
        if (fkFieldName) {
          const fkFieldValue = values[fkFieldName];
          const fkNameLowerId = `${lowerFirst(fkSchema.field)}Id`;

          // This will never return a value since a set's has() shallow compares keys and objects will never be equal in this case
          const hasLocalId = lookup.has(`kind.${fkSchema.field}-id.${fkFieldValue}`);
          const idByLocalName = lookup.get(
            `kind.${fkSchema.field}-name.${fkFieldValue.toLowerCase()}`,
          );

          if (hasLocalId) {
            delete values[fkFieldName];
            values[fkNameLowerId] = fkFieldValue;
          } else if (idByLocalName) {
            delete values[fkFieldName];
            values[fkNameLowerId] = idByLocalName;
          } else {
            const hasRemoteId =
              (fkSchema.model === 'ReferenceData'
                ? await models.ReferenceData.count({
                    where: { type: fkSchema.types, id: fkFieldValue },
                  })
                : await models[fkSchema.model].count({ where: { id: fkFieldValue } })) > 0;

            const idByRemoteName = (
              fkSchema.model === 'ReferenceData'
                ? await models.ReferenceData.findOne({
                    where: { type: fkSchema.types, name: { [Op.iLike]: fkFieldValue } },
                  })
                : await models[fkSchema.model].findOne({
                    where: {
                      name: { [Op.iLike]: fkFieldValue },
                    },
                  })
            )?.id;

            if (hasRemoteId) {
              delete values[fkFieldName];
              values[fkNameLowerId] = fkFieldValue;
            } else if (idByRemoteName) {
              delete values[fkFieldName];
              values[fkNameLowerId] = idByRemoteName;
            } else {
              throw new Error(
                `valid foreign key expected in column ${fkFieldName} (corresponding to ${fkNameLowerId}) but found: ${fkFieldValue}`,
              );
            }
          }
        }
      }

      resolvedRows.push({ model, sheetRow, values });
    } catch (err) {
      updateStat(stats, statkey(model, sheetName), 'errored');
      errors.push(new ForeignkeyResolutionError(sheetName, sheetRow, err));
    }
  }

  if (resolvedRows.length === 0) {
    log.debug('Nothing left, skipping');
    return stats;
  }

  log.debug('Validating data', { rows: resolvedRows.length });
  const validRows = [];
  for (const { model, sheetRow, values } of resolvedRows) {
    try {
      let schemaName;
      if (model === 'ReferenceData') {
        const specificSchemaName = `RD${sheetName}`;
        const specificSchemaExists = !!schemas[specificSchemaName];
        if (specificSchemaExists) {
          schemaName = specificSchemaName;
        } else {
          schemaName = 'ReferenceData';
        }
      } else if (model === 'SurveyScreenComponent') {
        // The question type is added to the SSC rows in programImporter/screens.js
        const { type } = values;
        const specificSchemaName = `SSC${type}`;
        const specificSchemaExists = !!schemas[specificSchemaName];
        if (config.validateQuestionConfigs.enabled && specificSchemaExists) {
          schemaName = specificSchemaName;
        } else {
          schemaName = 'SurveyScreenComponent';
        }
      } else {
        const specificSchemaExists = !!schemas[model];
        if (specificSchemaExists) {
          schemaName = model;
        } else {
          schemaName = 'Base';
        }
      }

      const schema = schemas[schemaName];
      validRows.push({
        model,
        sheetRow,
        values: await schema.validate(values, { abortEarly: false, context: validationContext }),
      });
    } catch (err) {
      updateStat(stats, statkey(model, sheetName), 'errored');
      if (err instanceof YupValidationError) {
        for (const valerr of err.errors) {
          errors.push(new ValidationError(sheetName, sheetRow, valerr));
        }
      }
    }
  }

  if (validRows.length === 0) {
    log.debug('Nothing left, skipping');
    return stats;
  }

  // Check values across the whole spreadsheet
  const pushErrorFn = (model, sheetRow, message) => {
    updateStat(stats, statkey(model, sheetName), 'errored');
    errors.push(new ValidationError(sheetName, sheetRow, message));
  };
  await validateTableRows(models, validRows, pushErrorFn);

  log.debug('Upserting database rows', { rows: validRows.length });
  const translationData = [];
  for (const { model, sheetRow, values } of validRows) {
    const Model = models[model];
    const existing = await loadExisting(Model, values);

    if (existing && skipExisting) {
      updateStat(stats, statkey(model, sheetName), 'skipped');
      continue;
    }

    try {
      if (existing) {
        await existing.update(values);
        if (values.deletedAt) {
          if (!['Permission', 'SurveyScreenComponent', 'UserFacility'].includes(model)) {
            throw new ValidationError(`Deleting ${model} via the importer is not supported`);
          }
          await existing.destroy();
          updateStat(stats, statkey(model, sheetName), 'deleted');
        } else {
          if (existing.deletedAt) {
            await existing.restore();
            updateStat(stats, statkey(model, sheetName), 'restored');
          }
          updateStat(stats, statkey(model, sheetName), 'updated');
        }
      } else {
        await Model.create(values);
        updateStat(stats, statkey(model, sheetName), 'created');
      }

      const dataType = normaliseSheetName(sheetName, model);
      const isValidTable = model === 'ReferenceData' || camelCase(model) === dataType; // All records in the reference data table are translatable // This prevents join tables from being translated - unsure about this
      const isTranslatable = TRANSLATABLE_REFERENCE_TYPES.includes(dataType);
      if (isTranslatable && isValidTable) {
        // Create Translations for reference data record
        translationData.push([
          `${REFERENCE_DATA_TRANSLATION_PREFIX}.${dataType}.${values.id}`,
          extractRecordName(values, dataType) ?? '',
          DEFAULT_LANGUAGE_CODE,
        ]);
        // Create Translations for reference data records options if exist 
        // This includes patient_field_definition options
        if (values.options) {
          for (const option of values.options) {
            translationData.push([
              `${REFERENCE_DATA_TRANSLATION_PREFIX}.${dataType}.${values.id}.option.${camelCase(option)}`,
              option,
              DEFAULT_LANGUAGE_CODE,
            ]);
          }
        }
      }
    } catch (err) {
      updateStat(stats, statkey(model, sheetName), 'errored');
      errors.push(new UpsertionError(sheetName, sheetRow, err));
    }
  }

  // Bulk upsert translation defaults
  if (translationData.length > 0) {
    await models.TranslatedString.sequelize.query(
      `
        INSERT INTO translated_strings (string_id, text, language)
        VALUES ${translationData.map(() => '(?)').join(',')}
          ON CONFLICT (string_id, language) DO UPDATE SET text = excluded.text;
      `,
      {
        replacements: translationData,
        type: models.TranslatedString.sequelize.QueryTypes.INSERT,
      },
    );
  }

  log.debug('Done with these rows');
  return stats;
}
