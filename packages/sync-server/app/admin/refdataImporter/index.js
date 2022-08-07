import { singularize } from 'inflection';
import { camelCase, upperFirst, lowerCase } from 'lodash';
import { Sequelize } from 'sequelize';
import { readFile } from 'xlsx';

import { log } from 'shared/services/logging';
import { REFERENCE_TYPE_VALUES } from 'shared/constants';

import {
  referenceDataLoaderFactory,
  loaderFactory,
} from './loaders';
import { DryRun } from './errors';
import { importSheet } from './sheet';
import { coalesceStats } from './stats';
import DEPENDENCIES from './dependencies';

export const PERMISSIONS = ['User', 'ReferenceData'];

function normalise(name) {
  const norm = singularize(camelCase(singularize(lowerCase(name))));

  if (norm === 'placesOfBirth') return 'placeOfBirth';
  if (norm === 'vaccineSchedule') return 'scheduledVaccine';

  return norm;
}

async function importerInner({ errors, models, stats, file, whitelist = [] }) {
  log.info('Importing data definitions from file', { file });

  log.debug('Parse XLSX workbook');
  const workbook = readFile(file);

  log.debug('Normalise all sheet names for lookup');
  const sheets = new Map();
  for (const [sheetName, sheet] of Object.entries(workbook.Sheets)) {
    const name = normalise(sheetName);

    if (whitelist.length && !whitelist.includes(name)) {
      log.debug('Sheet has been manually excluded', { name });
      continue;
    }

    log.debug('Found and normalised sheet', { name });
    sheets.set(name, sheet);
  }

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

  const refDataTypes = ['diagnosis', ...REFERENCE_TYPE_VALUES];

  log.debug('Import all reference data', { types: refDataTypes });
  const importedRef = [];
  for (const refType of refDataTypes) {
    log.debug('Look for reference data in sheets', { refType });
    const sheet = sheets.get(refType);
    if (!sheet) continue;

    log.debug('Found a sheet for the reference data', { refType });
    stats.push(
      await importSheet(context(refType, 'referenceData'), {
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
  const dataTypes = Object.entries(DEPENDENCIES).map(([k, v]) => [normalise(k), v]);
  // eslint-disable-next-line no-unused-vars
  dataTypes.sort(([_ka, a], [_kb, b]) => (a.needs?.length ?? 0) - (b.needs?.length ?? 0));

  log.debug('Importing other data types', { dataTypes });
  const importedData = [];
  const droppedData = [];

  let loopProtection = 100;
  while (dataTypes.length > 0 && loopProtection > 0) {
    loopProtection -= 1;

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
      await importSheet(context(dataType), {
        loader,
        sheetName: dataType,
        sheet,
      }),
    );
    importedData.push(dataType);
  }
  
  if (!loopProtection) throw new Error('Loop, cycle, or unresolvable import dependencies');

  log.debug('Done importing data', { importedData, droppedData });
}

export async function importer({
  models,
  file,
  dryRun = false,
  whitelist = [],
}) {
  const errors = [];
  const stats = [];

  try {
    log.debug('Starting transaction');
    await models.ReferenceData.sequelize.transaction(
      {
        // strongest level to be sure to read/write good data
        isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
      },
      async () => {
        await importerInner({ errors, models, stats, file, whitelist });
        if (errors.length > 0) throw new Error('rollback on errors');
        if (dryRun) throw new DryRun(); // roll back the transaction
      },
    );
    log.debug('Ended transaction');

    if (dryRun) {
      throw new Error('Data import completed but it was a dry run!!!');
    } else {
      return { errors: [], stats: coalesceStats(stats) };
    }
  } catch (err) {
    log.error(`while importing refdata: ${err.stack}`);
    if (dryRun && err instanceof DryRun) {
      return {
        didntSendReason: 'dryRun',
        errors: [],
        stats: coalesceStats(stats),
      };
    }
    if (errors.length) {
      return {
        didntSendReason: 'validationFailed',
        errors,
        stats: coalesceStats(stats),
      };
    }
    return {
      didntSendReason: 'validationFailed',
      errors: [err],
      stats: coalesceStats(stats),
    };
  }
}
