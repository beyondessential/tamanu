import { utils } from 'xlsx';
import {
  DataLoaderError,
  ForeignkeyResolutionError,
  UpstertionError,
  ValidationError,
  WorkSheetError
} from './errors';

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
        stats[model] = stats[model] || { created: 0, updated: 0, errored: 0 };
        tableRows.push({ model, sheetRow, values });
      }
    } catch (err) {
      errors.push(new DataLoaderError(sheetName, sheetRow, err));
    }
  }

  log.debug('Resolving foreign keys', { rows: tableRows.length });
  const resolvedRows = [];
  for (const { model, sheetRow, values } of tableRows) {
    try {
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
      validRows.push({ model, sheetRow, values });
    } catch (err) {
      stats[model].errored += 1;
      errors.push(new ValidationError(sheetName, sheetRow, err));
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
