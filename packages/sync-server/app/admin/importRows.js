import { camelCase, lowerCase, lowerFirst, startCase, upperFirst } from 'lodash';
import { Op } from 'sequelize';
import { ValidationError as YupValidationError } from 'yup';
import config from 'config';
import { VISIBILITY_STATUSES } from '@tamanu/constants';

import { ForeignkeyResolutionError, UpsertionError, ValidationError } from './errors';
import { statkey, updateStat } from './stats';
import * as schemas from './importSchemas';

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

function getPrimaryKey(model, values) {
  if (model === 'PatientAdditionalData') {
    return values.patientId;
  }

  return values.id;
}

function loadExisting(Model, id) {
  if (!id) return null;

  // user model needs to have access to password to hash it
  if (Model.name === 'User') return Model.scope('withPassword').findByPk(id, { paranoid: false });

  return Model.findByPk(id, { paranoid: false });
}

const destroyRecord = async (Model, record) => {
  if (Model.name === 'SurveyScreenComponent') {
    return record.update({ visibilityStatus: VISIBILITY_STATUSES.HISTORICAL });
  }
  return record.destroy();
};

const restoreRecord = async (Model, record) => {
  if (Model.name === 'SurveyScreenComponent') {
    return record.update({ visibilityStatus: VISIBILITY_STATUSES.CURRENT });
  }
  return record.restore();
};

const valuesIsHistorical = (Model, values) => {
  if (Model.name === 'SurveyScreenComponent') {
    return values.visibilityStatus === VISIBILITY_STATUSES.HISTORICAL;
  }

  return !!values.deletedAt;
};

export async function importRows(
  { errors, log, models },
  { rows, sheetName, stats: previousStats = {}, foreignKeySchemata = {} },
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
    lookup.set({ kind, id }, null);
    if (name) lookup.set({ kind, name: name.toLowerCase() }, id);
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

          const hasLocalId = lookup.has({ kind: fkSchema.field, id: fkFieldValue });
          const idByLocalName = lookup.get({
            kind: fkSchema.field,
            name: fkFieldValue.toLowerCase(),
          });

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

            const idByRemoteName = (fkSchema.model === 'ReferenceData'
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
        values: await schema.validate(values, { abortEarly: false }),
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

  log.debug('Upserting database rows', { rows: validRows.length });
  for (const { model, sheetRow, values } of validRows) {
    const Model = models[model];
    const primaryKey = getPrimaryKey(model, values);
    const existing = await loadExisting(Model, primaryKey);
    try {
      if (existing) {
        if (valuesIsHistorical(Model, values)) {
          await destroyRecord(Model, existing);
          updateStat(stats, statkey(model, sheetName), 'deleted');
        } else {
          if (valuesIsHistorical(Model, existing)) {
            await restoreRecord(Model, existing);
            updateStat(stats, statkey(model, sheetName), 'restored');
          }
          await existing.update(values);
          updateStat(stats, statkey(model, sheetName), 'updated');
        }
      } else {
        await Model.create(values);
        updateStat(stats, statkey(model, sheetName), 'created');
      }
    } catch (err) {
      updateStat(stats, statkey(model, sheetName), 'errored');
      errors.push(new UpsertionError(sheetName, sheetRow, err));
    }
  }

  log.debug('Done with these rows');
  return stats;
}
