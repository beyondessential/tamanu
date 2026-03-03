import { utils } from 'xlsx';

import { REFERENCE_TYPE_VALUES, REFERENCE_TYPES } from '@tamanu/constants';
import { DataLoaderError, ValidationError, WorkSheetError } from '../errors';
import { statkey, updateStat } from '../stats';
import { importRows } from '../importer/importRows';

const FOREIGN_KEY_SCHEMATA = {
  CertifiableVaccine: [
    {
      field: 'vaccine',
      model: 'ReferenceData',
      types: ['drug'],
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
      types: ['drug'],
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

// https://github.com/SheetJS/sheetjs/issues/214#issuecomment-96843418
const extractHeader = sheet => {
  const header = [];
  const range = utils.decode_range(sheet['!ref']);
  let C,
    R = range.s.r; /* start in the first row */
  /* walk every column in the range */
  for (C = range.s.c; C <= range.e.c; ++C) {
    const cell = sheet[utils.encode_cell({ c: C, r: R })]; /* find the cell in the first row */

    if (cell && cell.t) header.push(utils.format_cell(cell));
  }
  return header;
};

export async function importSheet(
  { errors, log, models },
  { loader, sheetName, sheet, skipExisting },
) {
  const stats = {};

  log.debug('Loading rows from sheet');
  let sheetHeader;
  let sheetRows;
  try {
    sheetHeader = extractHeader(sheet);
    // For drug sheets, include empty cells so facility columns with empty values are preserved
    sheetRows = sheetName === REFERENCE_TYPES.DRUG
      ? utils.sheet_to_json(sheet, { defval: '' })
      : utils.sheet_to_json(sheet);
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
      for (const { model, values } of await loader(trimmed, {
        models,
        foreignKeySchemata: FOREIGN_KEY_SCHEMATA,
        header: sheetHeader,
        pushError: (message, errModel) => {
          errors.push(new ValidationError(sheetName, sheetRow, message));
          if (errModel) {
            updateStat(stats, statkey(errModel, sheetName), 'errored');
          }
        },
      })) {
        if (!models[model]) throw new Error(`No such type of data: ${model}`);

        if (values.id && idCache.has(`${model}|${values.id}`)) {
          errors.push(new ValidationError(sheetName, sheetRow, `duplicate id: ${values.id}`));
          continue;
        } else {
          idCache.add(`${model}|${values.id}`);
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
    { rows: tableRows, sheetName, stats, foreignKeySchemata: FOREIGN_KEY_SCHEMATA, skipExisting },
  );

  return stats;
}
