import { upperFirst } from 'lodash';
import { read, readFile } from 'xlsx';

import { log } from '@tamanu/shared/services/logging';
import { REFERENCE_TYPE_VALUES } from '@tamanu/constants';

import { normaliseSheetName } from '../importer/importerEndpoint';

import { loaderFactory, referenceDataLoaderFactory } from './loaders';
import { importSheet } from './sheet';
import DEPENDENCIES from './dependencies';

export const PERMISSIONS = ['Permission', 'Role', 'User', 'ReferenceData'];

export async function referenceDataImporter({
  errors,
  models,
  stats,
  file,
  data = null,
  workbook: providedWorkbook = null,
  includedDataTypes = [],
  checkPermission,
  skipExisting,
}) {
  let workbook;
  if (providedWorkbook) {
    workbook = providedWorkbook;
    log.info('Importing data definitions from workbook');
  } else if (data) {
    workbook = read(data, { type: 'buffer' });
    log.info('Importing data definitions from data');
  } else if (file) {
    workbook = readFile(file);
    log.info('Importing data definitions from file', { file });
  } else {
    throw new Error('Must provide either workbook, data, or file');
  }

  if (checkPermission) {
    for (const dataType of includedDataTypes) {
      if (REFERENCE_TYPE_VALUES.includes(dataType)) {
        checkPermission('create', 'ReferenceData');
        checkPermission('write', 'ReferenceData');
        continue;
      }

      const nonReferenceDataModalName = upperFirst(dataType);
      checkPermission('create', nonReferenceDataModalName);
      checkPermission('write', nonReferenceDataModalName);
    }
  }

  log.debug('Normalise all sheet names for lookup');
  const sheets = new Map();
  for (const [sheetName, sheet] of Object.entries(workbook.Sheets)) {
    const name = normaliseSheetName(sheetName);

    if (!includedDataTypes.includes(name)) {
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

  log.debug('Import all reference data', { types: REFERENCE_TYPE_VALUES });
  const importedRef = [];
  for (const refType of REFERENCE_TYPE_VALUES) {
    log.debug('Look for reference data in sheets', { refType });
    const sheet = sheets.get(refType);
    if (!sheet) continue;

    log.debug('Found a sheet for the reference data', { refType });
    stats.push(
      await importSheet(context(refType, 'referenceData'), {
        loader: referenceDataLoaderFactory(refType),
        sheetName: refType,
        sheet,
        skipExisting,
      }),
    );
    importedRef.push(refType);
  }
  log.debug('Done importing reference data', { imported: importedRef });

  // sort by length of needs, so that stuff that doesn't depend on anything else gets done first
  // (as an optimisation, the algorithm doesn't need this, but it saves a few cycles)
  const nonRefDataTypes = Object.entries(DEPENDENCIES).map(([k, v]) => [normaliseSheetName(k), v]);
  // eslint-disable-next-line no-unused-vars
  nonRefDataTypes.sort(([_ka, a], [_kb, b]) => (a.needs?.length ?? 0) - (b.needs?.length ?? 0));

  log.debug('Importing other data types', { nonRefDataTypes });
  const importedData = [];
  const droppedData = [];

  let loopProtection = 100;
  while (nonRefDataTypes.length > 0 && loopProtection > 0) {
    loopProtection -= 1;

    const [dataType, { model = upperFirst(dataType), loader = loaderFactory(model), needs = [] }] =
      nonRefDataTypes.shift();

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
        nonRefDataTypes.push([dataType, { loader, model, needs }]);
        continue;
      }
    }

    stats.push(
      await importSheet(context(dataType), {
        loader,
        sheetName: dataType,
        sheet,
        skipExisting,
      }),
    );
    importedData.push(dataType);
  }

  if (!loopProtection) throw new Error('Loop, cycle, or unresolvable import dependencies');

  log.debug('Done importing data', { importedData, droppedData });
}
