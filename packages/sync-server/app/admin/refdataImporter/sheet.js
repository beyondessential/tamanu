import { camelCase, lowerCase, lowerFirst, startCase, upperFirst } from 'lodash';
import { utils } from 'xlsx';
import { ValidationError as YupValidationError } from 'yup';

import {
  DataLoaderError,
  ForeignkeyResolutionError,
  UpstertionError,
  ValidationError,
  WorkSheetError,
} from './errors';
import * as schemas from './schemas';
import { newStatsRow } from './stats';

// lowerCamelCase are refdata types
// UpperCamelCase are other models
const FOREIGN_KEY_FIELDS = {
  CertifiableVaccine: 'vaccine',
  Department: 'Facility',
  LabTestType: 'labTestCategory',
  Location: 'Facility',
  Patient: 'village',
  Permission: 'Role',
  ScheduledVaccine: 'vaccine',
};

function isRefData(kind) {
  return kind[0] === kind[0].toLowerCase();
}

function findFieldName(values, fkField) {
  const fkFieldLower = foreignKeyField.toLowerCase();
  const fkFieldCamel = camelCase(foreignKeyField);
  const fkFieldUcfirst = upperFirst(foreignKeyField);
  const fkFieldSplit = lowerCase(foreignKeyField);
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

  log.debug('Loading rows from sheet');
  let sheetRows;
  try {
    sheetRows = utils.sheet_to_json(sheet);
  } catch (err) {
    errors.push(new WorkSheetError(sheetName, 0, err));
    return stats;
  }

  log.debug('Preparing rows of data into table rows', { rows: sheetRows.length });
  const tableRows = [];
  for (const [sheetRow, data] of sheetRows.entries()) {
    try {
      for (const { model, values } of loader(data)) {
        stats[model] = stats[model] || newStatsRow();
        tableRows.push({ model, sheetRow, values });
      }
    } catch (err) {
      errors.push(new DataLoaderError(sheetName, sheetRow, err));
    }
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
      const foreignKeyField = FOREIGN_KEY_FIELDS[model];
      if (foreignKeyField) {
        const fkFieldName = findFieldName(values, foreignKeyField);
        if (fkFieldName) {
          const fkFieldValue = values[fkFieldName];
          const fkNameLowerId = `${lowerFirst(foreignKeyField)}Id`;

          const hasLocalId = lookup.has({ kind: foreignKeyField, id: fkFieldValue });
          const idByLocalName = lookup.get({
            kind: foreignKeyField,
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
              (isRefData(foreignKeyField)
                ? await models.ReferenceData.count({
                    where: { type: foreignKeyField, id: fkFieldValue },
                  })
                : await models[model].count({ where: { id: fkFieldValue } })) > 0;

            const idByRemoteName = (isRefData(foreignKeyField)
              ? await models.ReferenceData.findOne({
                  where: { type: foreignKeyField, name: fkFieldValue.toLowerCase() },
                })
              : await models[model].findOne({ where: { name: fkFieldValue.toLowerCase() } })
            )?.id;

            if (hasRemoteId) {
              delete values[fkFieldName];
              values[fkNameLowerId] = fkFieldValue;
            } else if (idByRemoteName) {
              delete values[fkFieldName];
              values[fkNameLowerId] = idByRemoteName;
            }
          }
        }
      }

      resolvedRows.push({ model, sheetRow, values });
    } catch (err) {
      stats[model].errored += 1;
      errors.push(new ForeignkeyResolutionError(sheetName, sheetRow, err));
    }
  }

  log.debug('Validating data', { rows: resolvedRows.length });
  const validRows = [];
  for (const { model, sheetRow, values } of resolvedRows) {
    try {
      const schemaName =
        model === 'ReferenceData'
          ? schemas[`RD${sheetName}`]
            ? `RD${sheetName}`
            : 'ReferenceData'
          : schemas[model]
          ? model
          : 'Base';

      const schema = schemas[schemaName];
      validRows.push({
        model,
        sheetRow,
        values: await schema.validate(values, { abortEarly: false }),
      });
    } catch (err) {
      stats[model].errored += 1;
      if (err instanceof YupValidationError) {
        for (const valerr of err.errors) {
          errors.push(new ValidationError(sheetName, sheetRow, valerr));
        }
      }
    }
  }

  log.debug('Upserting database rows', { rows: validRows.length });
  for (const { model, sheetRow, values } of validRows) {
    const Model = models[model];
    const existing = values.id && (await Model.findByPk(values.id));
    try {
      if (existing) {
        await existing.update(values);
        stats[model].updated += 1;
      } else {
        await Model.create(values);
        stats[model].created += 1;
      }
    } catch (err) {
      stats[model].errored += 1;
      errors.push(new UpstertionError(sheetName, sheetRow, err));
    }
  }

  return stats;
}
