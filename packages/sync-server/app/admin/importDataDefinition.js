import { readFile, utils } from 'xlsx';
import { getJsDateFromExcel } from 'excel-date-to-js';
import moment from 'moment';
import { camelCase, upperFirst } from 'lodash';

import { log } from 'shared/services/logging';
import { ENCOUNTER_TYPES } from 'shared/constants';

const loaderFactory = model => ({ note, ...values }) => ({ model, values });

function referenceDataLoaderFactory(refType) {
  return ({ id, code, name }) => [
    {
      model: 'ReferenceData',
      values: {
        id,
        type: refType,
        code: typeof code === 'number' ? `${code}` : code,
        name,
      },
    },
  ];
}

function administeredVaccineLoader(item) {
  const {
    encounterId,
    administeredVaccineId,
    date: excelDate,
    reason,
    consent,
    locationId,
    departmentId,
    examinerId,
    patientId,
    ...data
  } = item;
  const date = excelDate ? getJsDateFromExcel(excelDate) : null;

  const rows = [];

  rows.push({
    model: 'AdministeredVaccine',
    values: {
      id: administeredVaccineId,

      date,
      reason,
      consent: ['true', 'yes', 't', 'y'].some(v => v === consent?.toLowerCase()),
      ...data,

      // relationships
      encounterId,
    },
  });

  const startDate = date ? moment(date).startOf('day') : null;
  const endDate = date ? moment(date).endOf('day') : null;
  rows.push({
    model: Encounter,
    values: {
      id: encounterId,

      encounterType: ENCOUNTER_TYPES.CLINIC,
      startDate,
      endDate,
      reasonForEncounter: reason,

      // relationships
      administeredVaccines: [administeredVaccineId],
      locationId,
      departmentId,
      examinerId,
      patientId,
    },
  });

  return rows;
}

function patientDataLoader(item) {
  const { dateOfBirth, id: patientId, patientAdditionalDataId, ...otherFields } = item;

  const rows = [];

  rows.push({
    model: 'Patient',
    values: {
      id: patientId,
      dateOfBirth: dateOfBirth && getJsDateFromExcel(dateOfBirth),
      ...otherFields,
    },
  });

  if (patientAdditionalDataId) {
    rows.push({
      model: 'PatientAdditionalData',
      values: {
        id: patientAdditionalDataId,
        patientId,
        ...otherFields,
      },
    });
  }

  return rows;
}

// All reference data is imported first, so that can be assumed for ordering.
//
// sheetNameNormalisedToCamelCase: {
//   model: 'ModelName' (defaults to `upperFirst(sheetNameNormalisedToCamelCase)`),
//   loader: fn(item) => Array<LoadRow> (defaults to `loaderFactory(Model)`),
//   needs: ['otherSheetNames', 'thisOneNeeds'] (defaults to `[]`),
// }
//
// where interface LoadRow { model: string; values: object; }
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

async function loadData(log, models, loader, sheet) {
  log.debug('Loading data from sheet');
  const data = utils.sheet_to_json(sheet);
  
  log.debug('Preparing data into rows', { rows: data.length });
  const rows = [];
  for (const item of data) {
    rows.push(...loader(item));
  }
  log.debug('Obtained database rows to upsert', { count: instances.length });

  const stats = {};

  // TODO: optimise
  for (const { model, values } of rows) {
    stats[model] = stats[model] || { created: 0, updated: 0 };
    const Model = models[model];
    const existing = values.id && await Model.findByPk(values.id);
    if (existing) {
      await existing.update(values);
      stats[model].updated += 1;
    } else {
      await Model.create(values);
      stats[model].created += 1;
    }
  }
  
  return stats;
}

export async function importData(models, file, { whitelist = [] }) {
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
  
  const stats = [];

  log.debug('Import all reference data', { types: refDataTypes });
  const importedRef = [];
  for (const refType of refDataTypes) {
    log.debug('Look for reference data in sheets', { refType });
    const sheet = sheets.get(refType);
    if (!sheet) continue;

    log.debug('Found a sheet for the reference data', { refType });
    stats.push(await loadData(
      log.child({
        file,
        dataType: 'referenceData',
      }),
      models,
      referenceDataLoaderFactory(refType),
      sheet,
    ));
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

    stats.push(await loadData(
      log.child({
        file,
        dataType,
      }),
      models,
      loader,
      sheet,
    ));
    importedData.push(dataType);
  }

  log.debug('Done importing data', { importedData, droppedData });
  
  // coalesce stats
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
