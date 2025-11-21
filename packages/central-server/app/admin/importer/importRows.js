import { camelCase, lowerCase, lowerFirst, startCase, upperFirst } from 'lodash';
import { AggregateError, Op } from 'sequelize';
import { ValidationError as YupValidationError } from 'yup';
import config from 'config';

import { ForeignkeyResolutionError, UpsertionError, ValidationError } from '../errors';
import { statkey, updateStat } from '../stats';
import * as schemas from '../importSchemas';
import { validateTableRows } from './validateTableRows';
import { generateTranslationsForData } from './translationHandler';

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
    PFV.findOne({ where: { patientId, definitionId }, paranoid: false }),
  // TranslatedString model has a composite PK that uses stringId & language
  TranslatedString: (TS, { stringId, language }) =>
    TS.findOne({ where: { stringId, language }, paranoid: false }),
  ReferenceDataRelation: (RDR, { referenceDataId, referenceDataParentId, type }) =>
    RDR.findOne({ where: { referenceDataId, referenceDataParentId, type }, paranoid: false }),
  TaskTemplateDesignation: (TTD, { taskTemplateId, designationId }) =>
    TTD.findOne({ where: { taskTemplateId, designationId }, paranoid: false }),
  UserDesignation: (UD, { userId, designationId }) =>
    UD.findOne({ where: { userId, designationId }, paranoid: false }),
  UserFacility: (UF, { userId, facilityId }) =>
    UF.findOne({ where: { userId, facilityId }, paranoid: false }),
  ProcedureTypeSurvey: async (Model, values) => {
    const { procedureTypeId, surveyId } = values;
    if (!procedureTypeId || !surveyId) {
      return null;
    }
    return await Model.findOne({
      where: {
        procedureTypeId,
        surveyId,
      },
      paranoid: false,
    });
  },
};

function loadExisting(Model, values) {
  const loader = existingRecordLoaders[Model.name] || existingRecordLoaders.default;
  return loader(Model, values);
}

// Configuration for fields to ignore when checking for changes per model
const IGNORED_FIELDS_BY_MODEL = {
  SurveyScreenComponent: ['componentIndex'],
};

function checkForChanges(existing, normalizedValues, model) {
  const ignoredFields = IGNORED_FIELDS_BY_MODEL[model] || [];

  return Object.keys(normalizedValues)
    .filter(key => !ignoredFields?.includes(key))
    .some(key => {
      // At this point, we already updated the existing row with the normalized values
      // so we need to check the previous data values to see if there was a change
      const existingValue = existing._previousDataValues[key];
      const normalizedValue = normalizedValues[key];

      if (typeof existingValue === 'number') {
        return isNaN(normalizedValue) ? false : Number(normalizedValue) !== existingValue;
      }
      return existing.changed(key);
    });
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
  for (const { model, sheetRow, values } of validRows) {
    const Model = models[model];
    const existing = await loadExisting(Model, values);

    if (existing && skipExisting) {
      updateStat(stats, statkey(model, sheetName), 'skipped');
      continue;
    }

    try {
      // Normalize undefined values to null to avoid incorrect change detection
      const normalizedValues = { ...values };
      Object.keys(normalizedValues).forEach(key => {
        if (normalizedValues[key] === undefined) {
          normalizedValues[key] = null;
        }
      });

      if (existing) {
        if (normalizedValues.deletedAt) {
          if (
            ![
              'Permission',
              'SurveyScreenComponent',
              'UserFacility',
              'ProcedureTypeSurvey',
              'TranslatedString',
            ].includes(model)
          ) {
            throw new Error(`Deleting ${model} via the importer is not supported`);
          }
          if (!existing.deletedAt) {
            updateStat(stats, statkey(model, sheetName), 'updated');
            updateStat(stats, statkey(model, sheetName), 'deleted');
          } else {
            updateStat(stats, statkey(model, sheetName), 'skipped');
          }
          await existing.update(normalizedValues);
          await existing.destroy();
        } else {
          let hasUpdatedStats = false;
          if (existing.deletedAt) {
            await existing.restore();
            updateStat(stats, statkey(model, sheetName), 'restored');
            updateStat(stats, statkey(model, sheetName), 'updated');
            hasUpdatedStats = true;
          }

          existing.set(normalizedValues);
          const hasValueChanges = checkForChanges(existing, normalizedValues, model);

          if (model === 'ReferenceData' && existing.systemRequired && hasValueChanges) {
            throw new Error('Cannot modify system-required reference data');
          }

          if (!hasUpdatedStats) {
            if (hasValueChanges) {
              updateStat(stats, statkey(model, sheetName), 'updated');
            } else {
              updateStat(stats, statkey(model, sheetName), 'skipped');
            }
          }
          await existing.save();
        }
      } else {
        await Model.create(normalizedValues);
        updateStat(stats, statkey(model, sheetName), 'created');
      }

      const recordTranslationData = generateTranslationsForData(model, sheetName, normalizedValues);
      try {
        await models.TranslatedString.bulkCreate(recordTranslationData, {
          validate: true,
          updateOnDuplicate: ['text'],
        });
      } catch (err) {
        if (!(err instanceof AggregateError)) {
          throw err; // Not a sequelize bulk create error, so let it bubble up
        }

        updateStat(stats, statkey(model, sheetName), 'errored');
        for (const error of err.errors) {
          errors.push(new ValidationError(sheetName, sheetRow, error.message));
        }
      }
    } catch (err) {
      updateStat(stats, statkey(model, sheetName), 'errored');
      errors.push(new UpsertionError(sheetName, sheetRow, err));
    }
  }

  log.debug('Done with these rows');
  return stats;
}
