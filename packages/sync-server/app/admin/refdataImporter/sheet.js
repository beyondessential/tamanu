import { camelCase, lowerCase, lowerFirst, startCase, upperFirst } from 'lodash';
import { Op } from 'sequelize';
import { utils } from 'xlsx';
import { ValidationError as YupValidationError } from 'yup';

import {
  DataLoaderError,
  ForeignkeyResolutionError,
  UpsertionError,
  ValidationError,
  WorkSheetError,
} from '../errors';
import { newStatsRow } from '../stats';
import * as schemas from './schemas';

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
};

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

export async function importSheet({ errors, log, models }, { loader, sheetName, sheet }) {
  const stats = {};
  const statkey = model => (model === 'ReferenceData' ? `${model}/${sheetName}` : model);

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
  for (const [sheetRow, data] of sheetRows.entries()) {
    try {
      for (const { model, values } of loader(data)) {
        if (!models[model]) throw new Error(`No such type of data: ${model}`);

        if (values.id && idCache.has(values.id)) {
          errors.push(new ValidationError(sheetName, sheetRow, `duplicate id: ${values.id}`));
          continue;
        } else {
          idCache.add(values.id);
        }

        stats[statkey(model)] = stats[statkey(model)] || newStatsRow();
        tableRows.push({ model, sheetRow, values });
      }
    } catch (err) {
      errors.push(new DataLoaderError(sheetName, sheetRow, err));
    }
  }

  if (tableRows.length === 0) {
    log.debug('Nothing left, skipping');
    return stats;
  }

  log.debug('Building reverse lookup table');
  const lookup = new Map();
  for (const {
    model,
    values: { id, type = null, name = null },
  } of tableRows) {
    if (!id) continue;
    const kind = model === 'ReferenceData' ? type : model;
    lookup.set({ kind, id }, null);
    if (name) lookup.set({ kind, name: name.toLowerCase() }, id);
  }

  log.debug('Resolving foreign keys', { rows: tableRows.length });
  const resolvedRows = [];
  for (const { model, sheetRow, values } of tableRows) {
    try {
      for (const fkSchema of FOREIGN_KEY_SCHEMATA[model] ?? []) {
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
      stats[statkey(model)].errored += 1;
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
      stats[statkey(model)].errored += 1;
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
    const existing = values.id && (await Model.findByPk(values.id));
    try {
      if (existing) {
        await existing.update(values);
        stats[statkey(model)].updated += 1;
      } else {
        await Model.create(values);
        stats[statkey(model)].created += 1;
      }
    } catch (err) {
      stats[statkey(model)].errored += 1;
      errors.push(new UpsertionError(sheetName, sheetRow, err));
    }
  }

  return stats;
}
