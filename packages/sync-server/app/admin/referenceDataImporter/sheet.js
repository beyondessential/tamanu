import { utils } from 'xlsx';

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
  for (const [sheetRow, data] of sheetRows.entries()) {
    const trimmed = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key.trim(), value]),
    );
    try {
      for (const { model, values } of loader(trimmed)) {
        if (!models[model]) throw new Error(`No such type of data: ${model}`);

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
      console.log('error', err);
      errors.push(new DataLoaderError(sheetName, sheetRow, err));
    }
  }

  await importRows(
    { errors, log, models },
    { rows: tableRows, sheetName, stats, foreignKeySchemata: FOREIGN_KEY_SCHEMATA },
  );

  return stats;
}
