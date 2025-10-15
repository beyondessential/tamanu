import { utils } from 'xlsx';

import { REFERENCE_TYPE_VALUES } from '@tamanu/constants';
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
  InvoicePriceListItem: [
    {
      field: 'invoicePriceList',
      model: 'InvoicePriceList',
    },
    {
      field: 'invoiceProduct',
      model: 'InvoiceProduct',
    },
  ],
};

export async function importSheet(
  { errors, log, models },
  { loader, sheetName, sheet, skipExisting },
) {
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

  // Special handling for the price Lists sheet
  if (sheetName === 'priceList') {
    log.debug('Price Lists sheet; transforming to rows');
    const headers = Object.keys(sheetRows[0]).map(h => h.trim());
    const invoiceKey = headers.find(h => h.trim().toLowerCase() === 'invoiceproductid');
    const priceListIds = headers.filter(h => h !== invoiceKey);

    const tableRows = [];
    const idCache = new Set();

    // Create InvoicePriceList rows from headers
    for (const plId of priceListIds) {
      const values = { id: plId, code: plId, name: plId };
      if (idCache.has(`InvoicePriceList|${values.id}`)) {
        errors.push(new ValidationError(sheetName, 0, `duplicate id: ${values.id}`));
        continue;
      }
      idCache.add(`InvoicePriceList|${values.id}`);
      updateStat(stats, statkey('InvoicePriceList', sheetName), 'created', 0);
      tableRows.push({ model: 'InvoicePriceList', sheetRow: 0, values });
    }

    // Create InvoicePriceListItem rows for each value
    sheetRows.forEach((row, idx) => {
      const invoiceProductId = row[invoiceKey];

      if (!invoiceProductId) {
        return;
      }

      for (const priceListId of priceListIds) {
        const raw = row[priceListId];

        if (raw === undefined || raw === null || `${raw}`.trim() === '') {
          continue;
        }
        const num = Number(raw);
        if (Number.isNaN(num)) {
          errors.push(
            new ValidationError(
              sheetName,
              idx,
              `Invalid price value '${raw}' for priceList '${priceListId}' and invoiceProductId '${invoiceProductId}'`,
            ),
          );
          return; // skip this row on error for now
        }
        const id = `${priceListId}-${invoiceProductId}`;
        tableRows.push({
          model: 'InvoicePriceListItem',
          sheetRow: idx,
          values: {
            id,
            priceListId: priceListId,
            invoiceProductId: `${invoiceProductId}`,
            price: num,
          },
        });
      }
    });

    return await importRows(
      { errors, log, models },
      { rows: tableRows, sheetName, stats, foreignKeySchemata: FOREIGN_KEY_SCHEMATA, skipExisting },
    );
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
        pushError: message => errors.push(new ValidationError(sheetName, sheetRow, message)),
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
