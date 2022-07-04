import { readFile, utils } from 'xlsx';
import { getJsDateFromExcel } from 'excel-date-to-js';
import moment from 'moment';
import { camelCase } from 'lodash';

import { log } from 'shared/services/logging';
import { ENCOUNTER_TYPES, IMAGING_AREA_TYPES } from 'shared/constants';
import { ReferenceData } from 'shared/models';

const normaliseSheetName = string => camelCase(string.replace(/[^a-z0-9]+/g, '-'));

const recordTransformer = type => item => {
  // ignore "note" column
  const { note, ...rest } = item;
  return {
    recordType: type,
    data: {
      ...rest,
    },
  };
};

const referenceDataTransformer = type => item => {
  const { code } = item;
  return {
    recordType: 'referenceData',
    data: {
      ...item,
      code: typeof code === 'number' ? `${code}` : code,
      type,
    },
  };
};

const administeredVaccineTransformer = () => ({
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
}) => {
  const date = excelDate ? getJsDateFromExcel(excelDate) : null;
  const administeredVaccine = {
    recordType: 'administeredVaccine',
    data: {
      id: administeredVaccineId,
      encounterId,
      date,
      reason,
      consent: ['true', 'yes', 't', 'y'].some(v => v === consent?.toLowerCase()),
      ...data,
    },
  };
  const startDate = date ? moment(date).startOf('day') : null;
  const endDate = date ? moment(date).endOf('day') : null;
  return {
    recordType: 'encounter',
    channel: `patient/${encodeURIComponent(patientId)}/encounter`,
    data: {
      id: encounterId,
      encounterType: ENCOUNTER_TYPES.CLINIC,
      startDate,
      endDate,
      reasonForEncounter: reason,
      administeredVaccines: [administeredVaccine],

      // relationships
      locationId,
      departmentId,
      examinerId,
      patientId,
    },
  };
};

const patientDataTransformer = item => {
  const { dateOfBirth, id: patientId, patientAdditionalDataId, ...otherFields } = item;
  const transformers = [
    {
      recordType: 'patient',
      data: {
        id: patientId,
        dateOfBirth: dateOfBirth && getJsDateFromExcel(dateOfBirth),
        ...otherFields,
      },
    },
  ];

  if (patientAdditionalDataId) {
    transformers.push({
      recordType: `patientAdditionalData`,
      channel: 'import/patientAdditionalData',
      data: {
        id: patientAdditionalDataId,
        patientId,
        ...otherFields,
      },
    });
  }

  return transformers;
};

const makeTransformer = (sheetName, transformer) => {
  if (Array.isArray(transformer)) {
    return transformer.map(t => ({ sheetName, transformer: t }));
  }

  return {
    sheetName,
    transformer,
  };
};

// All reference data is imported first, so that can be assumed for ordering.
const DEPENDENCIES = {
  users: {},
  
  patients: {
    transformer: patientDataTransformer,
    needs: ['users'],
  },

  certifiableVaccines: {},
  vaccineSchedules: {},
  administeredVaccines: {
    transformer: administeredVaccineTransformer,
    needs: ['vaccineSchedules', 'users'],
  },

  labTestTypes: {},
  invoicePriceChangeTypes: {},
  invoiceLineTypes: {
    needs: ['labTestType'],
  },
};

export async function importData({ file, whitelist = [] }) {
  log.info(`Importing data definitions from ${file}...`);
  
  log.debug('Parse XLSX workbook');
  const workbook = readFile(file);

  log.debug('Normalise all sheet names for lookup');
  const sheets = new Map;
  for (const [sheetName, sheet] of Object.entries(workbook.Sheets)) {
    sheets.set(normaliseSheetName(sheetName), sheet);
  }

  log.debug('Gather possible types of reference data');
  const refDataTypes = (await ReferenceData.findAll({
    attributes: ['type'],
    group: 'type',
  })).map(ref => ref.type);

  log.debug('Import all reference data', { types: refDataTypes });
  const importedRef = [];
  for (const refType of refDataTypes) {
    log.debug('Look for reference data in sheets', { refType });
    const sheet = sheets.get(refType);
    if (!sheet) continue;
    
    log.debug('Found a sheet for the reference data', { refType });
    await loadReferenceData(refType, sheet);
    importedRef.push(refType);
  }
  log.debug('Done importing reference data', { imported: importedRef });

  // sort by length of needs, so that stuff that doesn't depend on anything else gets done first
  // (as an optimisation, the algorithm doesn't need this, but it saves a few cycles)
  const dataTypes = Object.entries(DEPENDENCIES);
  dataTypes.sort(([_, a], [_, b]) => (a.needs?.length ?? 0) - (b.needs?.length ?? 0));

  log.debug('Importing other data types', { dataTypes });
  const importedData = [];
  const droppedData = [];
  while (dataTypes.length > 0) {
    const [dataType, { needs = [], transformer = recordTransformer(dataType) }] = dataTypes.shift();

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
        dataTypes.push([dataType, { needs, transformer }]);
        continue;
      }
    }

    await loadData(dataType, transformer, sheet);
    importedData.push(dataType);
  }

  log.debug('Done importing data', { importedData, droppedData });
}


  // // set up the importer
  // const importSheet = (sheetName, transformer) => {
  //   const sheet = sheets[sheetName.toLowerCase()];
  //   const data = utils.sheet_to_json(sheet);

  //   return data
  //     .filter(item => Object.values(item).some(x => x))
  //     .map(item => {
  //       const transformed = transformer(item);
  //       if (!transformed) return null;

  //       // transformer can return an object or an array of object
  //       return [transformed].flat().map(t => ({
  //         sheet: sheetName,
  //         row: item.__rowNum__ + 1, // account for 0-based js vs 1-based excel
  //         ...t,
  //       }));
  //     })
  //     .flat();
  // };

  // // figure out which transformers we're actually using
  // const lowercaseWhitelist = whitelist.map(x => x.toLowerCase());
  // const activeTransformers = transformers.filter(({ sheetName, transformer }) => {
  //   if (!transformer) return false;
  //   if (whitelist.length > 0 && !lowercaseWhitelist.includes(sheetName.toLowerCase())) {
  //     return false;
  //   }
  //   const sheet = sheets[sheetName.toLowerCase()];
  //   if (!sheet) return false;

  //   return true;
  // });

  // // restructure the parsed data to sync record format
  // return activeTransformers
  //   .map(({ sheetName, transformer }) => importSheet(sheetName, transformer))
  //   .flat()
  //   .filter(x => x);
