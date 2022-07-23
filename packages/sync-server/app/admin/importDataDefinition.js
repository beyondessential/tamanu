import { camelCase, upperFirst } from 'lodash';
import { Sequelize } from 'sequelize';
import { readFile, utils } from 'xlsx';

import { log } from 'shared/services/logging';

import {
  DataLoaderError,
  DryRun,
  ForeignkeyResolutionError,
  UpstertionError,
  ValidationError,
  WorkSheetError,
} from './errors';
import {
  patientDataLoader,
  administeredVaccineLoader,
  referenceDataLoaderFactory,
  loaderFactory,
} from './dataLoaders';

// All reference data is imported first, so that can be assumed for ordering.
//
// sheetNameNormalisedToCamelCase: {
//   model: 'ModelName' (defaults to `upperFirst(sheetNameNormalisedToCamelCase)`),
//   loader: fn(item) => Array<LoadRow> (defaults to `loaderFactory(Model)`),
//   needs: ['otherSheetNames', 'thisOneNeeds'] (defaults to `[]`),
// }
//
// where interface LoadRow { model: string; values: object; }
//
// creating dependency cycles is a sin (it will deadloop, don't do it)
const DEPENDENCIES = {
  users: {},

  patients: {
    loader: patientDataLoader,
    needs: ['users'],
  },

  certifiableVaccines: {},
  vaccineSchedules: {},
  administeredVaccines: {
    loader: administeredVaccineLoader,
    needs: ['vaccineSchedules', 'users'],
  },

  labTestTypes: {},
  invoicePriceChangeTypes: {},
  invoiceLineTypes: {
    needs: ['labTestType'],
  },
};

async function loadData({ errors, log, models }, { loader, sheetName, sheet }) {
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

async function importDataInner({ errors, models, stats, file, whitelist = [] }) {
  log.info('Importing data definitions from file', { file });

  log.debug('Parse XLSX workbook');
  const workbook = readFile(file);

  log.debug('Normalise all sheet names for lookup');
  const sheets = new Map();
  for (const [sheetName, sheet] of Object.entries(workbook.Sheets)) {
    const name = camelCase(sheetName.replace(/[^a-z0-9]+/g, '-'));

    if (whitelist.length && !whitelist.includes(name)) {
      log.debug('Sheet has been manually excluded', { name });
      continue;
    }

    sheets.set(name, sheet);
  }

  log.debug('Gather possible types of reference data');
  const refDataTypes = (
    await models.ReferenceData.findAll({
      attributes: ['type'],
      group: 'type',
    })
  ).map(ref => ref.type);

  // general idea is there are a number of phases, and during each we iterate
  // through the entire set of remaining rows. any errors are caught and stored,
  // and the erroring rows are omitted from the set that goes on to the next bit
  //
  // if there are any errors at the end of the process, we throw to rollback the
  // transaction.
  //
  // pushing on like this means that there may be some false-positive errors in
  // later steps that actually wouldn't be errors if the right rows had made it
  // through without erroring previously. overall, though, it should provide a
  // lot more feedback than erroring early.

  const context = (sheetName, dataType = sheetName) => ({
    errors,
    log: log.child({
      file,
      dataType,
      sheetName,
    }),
    models,
  });

  log.debug('Import all reference data', { types: refDataTypes });
  const importedRef = [];
  for (const refType of refDataTypes) {
    log.debug('Look for reference data in sheets', { refType });
    const sheet = sheets.get(refType);
    if (!sheet) continue;

    log.debug('Found a sheet for the reference data', { refType });
    stats.push(
      await loadData(context(refType, 'referenceData'), {
        loader: referenceDataLoaderFactory(refType),
        sheetName: refType,
        sheet,
      }),
    );
    importedRef.push(refType);
  }
  log.debug('Done importing reference data', { imported: importedRef });

  // sort by length of needs, so that stuff that doesn't depend on anything else gets done first
  // (as an optimisation, the algorithm doesn't need this, but it saves a few cycles)
  const dataTypes = Object.entries(DEPENDENCIES);
  dataTypes.sort(([_ka, a], [_kb, b]) => (a.needs?.length ?? 0) - (b.needs?.length ?? 0));

  log.debug('Importing other data types', { dataTypes });
  const importedData = [];
  const droppedData = [];
  while (dataTypes.length > 0) {
    const [
      dataType,
      { model = upperFirst(dataType), loader = loaderFactory(model), needs = [] },
    ] = dataTypes.shift();

    log.debug('Look for data type in sheets', { dataType });
    const sheet = sheets.get(dataType);
    if (!sheet) {
      log.debug('No sheet for it, drop that data type', { dataType });
      droppedData.push(dataType);
      continue;
    }

    log.debug('Found a sheet for the data', { dataType });

    if (needs) {
      log.debug('Resolve data type needs', { dataType, needs });
      if (!needs.every(need => importedData.includes(need) || droppedData.includes(need))) {
        log.debug('Some needs are missing, deferring');
        dataTypes.push([dataType, { loader, model, needs }]);
        continue;
      }
    }

    stats.push(
      await loadData(context(dataType), {
        loader,
        sheetName: dataType,
        sheet,
      }),
    );
    importedData.push(dataType);
  }

  log.debug('Done importing data', { importedData, droppedData });
}

function coalesceStats(stats) {
  const allStats = {};
  for (const stat of stats) {
    for (const [model, { created, updated }] of Object.entries(stat)) {
      if (allStats[model]) {
        allStats[model].created += created;
        allStats[model].updated += updated;
      } else {
        allStats[model] = { created, updated };
      }
    }
  }

  log.debug('Imported lotsa things', { stats: allStats });
  return allStats;
}

export async function importData(models, file, { dryRun = false, whitelist = [] }) {
  const errors = [];
  const stats = [];

  try {
    await Sequelize.transaction(
      {
        // strongest level to be sure to read/write good data
        isolationLevel: Sequelize.Transaction.ISOLATION_LEVEL.SERIALIZABLE,
      },
      async () => {
        await importDataInner({ errors, models, stats, file, whitelist });
        if (errors.length > 0) throw new Error('rollback on errors');
        if (dryRun) throw new DryRun();
      },
    );

    if (dryRun) {
      throw new Error('Data import completed but it was a dry run!!!');
    } else {
      return { reason: 'done', errors: [], stats: coalesceStats(stats) };
    }
  } catch (err) {
    if (dryRun && err instanceof DryRun) {
      return {
        reason: 'dryrun',
        errors: [],
        stats: coalesceStats(stats),
      };
    } else {
      return {
        reason: 'errors',
        errors,
        stats: coalesceStats(stats),
      };
    }
  }
}
