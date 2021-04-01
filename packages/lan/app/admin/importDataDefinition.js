import { readFile, utils } from 'xlsx';
import { log } from 'shared/services/logging';

import { validate } from './importerValidators';

const sanitise = string => string.trim().replace(/[^A-Za-z0-9]+/g, '');
const convertSheetNameToImporterId = sheetName => sanitise(sheetName).toLowerCase();
const convertNameToCode = name => sanitise(name).toUpperCase();

const referenceDataTransformer = type => item => {
  const code = item.code;
  return {
    recordType: 'referenceData',
    data: {
      ...item,
      code: (typeof code === 'number') ? `${code}` : code,
      type,
    },
  };
};

const makeTransformer = (sheetName, transformer) => ({ 
  sheetName,
  transformer,
});

const transformers = [
  makeTransformer('facilities', referenceDataTransformer('facility')),
  makeTransformer('villages', referenceDataTransformer('village')),
  makeTransformer('drugs', referenceDataTransformer('drug')),
  makeTransformer('allergies', referenceDataTransformer('allergy')),
  makeTransformer('departments', referenceDataTransformer('department')),
  makeTransformer('locations', referenceDataTransformer('location')),
  makeTransformer('diagnoses', referenceDataTransformer('icd10')),
  makeTransformer('triageReasons', referenceDataTransformer('triageReason')),
  makeTransformer('imagingTypes', referenceDataTransformer('imagingType')),
  makeTransformer('procedures', referenceDataTransformer('procedureType')),
  makeTransformer('careplans', referenceDataTransformer('carePlan')),
  makeTransformer('ethnicities', referenceDataTransformer('ethnicity')),
  makeTransformer('nationalities', referenceDataTransformer('nationality')),
  makeTransformer('divisions', referenceDataTransformer('division')),
  makeTransformer('subdivisions', referenceDataTransformer('subdivision')),
  makeTransformer('medicalareas', referenceDataTransformer('medicalArea')),
  makeTransformer('nursingzones', referenceDataTransformer('nursingZone')),
  makeTransformer('settlements', referenceDataTransformer('settlement')),
  makeTransformer('occupations', referenceDataTransformer('occupation')),
  makeTransformer('labTestCategories', referenceDataTransformer('labTestCategory')),
  makeTransformer('users', null),
  makeTransformer('patients', null),
  makeTransformer('roles', null),
  makeTransformer('labTestTypes', null),
];

export async function importData({ file, whitelist = [] }) {
  log.info(`Importing data definitions from ${file}...`);

  // parse xlsx
  const workbook = readFile(file);
  const sheets = Object.entries(workbook.Sheets)
    .reduce((group, [sheetName, sheet]) => ({
      ...group,
      [sanitise(sheetName).toLowerCase()]: sheet,
    }), {});

  const lowercaseWhitelist = whitelist.map(x => x.toLowerCase());

  // figure out which transformers we're actually using
  const activeTransformers = transformers.filter(({ sheetName, transformer }) => {
    if(!transformer) return false;
    if(whitelist.length > 0 && !lowercaseWhitelist.includes(sheetName.toLowerCase())) {
      return false;
    }
    const sheet = sheets[sheetName.toLowerCase()];
    if(!sheet) return false;

    return true;
  });

  // restructure the parsed data to sync record format
  const allRecords = activeTransformers
    .map(({ sheetName, transformer, validator }) => {
      const sheet = sheets[sheetName.toLowerCase()];
      const data = utils.sheet_to_json(sheet);

      // track some additional properties against each item for validation
      data.forEach(d => {
        Object.defineProperty(d, '__sheet__', { 
          enumerable: false, 
          value: sheetName,
        });
      });

      return data.map(item => ({
        sheet: item.__sheet__,
        row: (item.__rowNum__ + 1), // account for 0-based js vs 1-based excel
        ...transformer(item),
      }));
    })
    .flat()
    .filter(x => x);

  // set up validation context
  const recordsById = allRecords.reduce(
    (all, current) => { 
      const { id } = current.data;
      return {
        ...all,
        [id]: all[id] || current,
      };
    },
    {}
  );
  const validationContext = { recordsById };

  // validate all records and then group them by status
  const validatedRecords = allRecords.map(r => validate(r, validationContext));
  const goodRecords = validatedRecords.filter(x => !x.error).filter(x => x);
  const badRecords = validatedRecords.filter(x => x.error);

  // compile some stats on successes 
  const sheetResults = {};
  activeTransformers.map(({ sheetName }) => {
    const filter = r => r.sheet === sheetName;
    sheetResults[sheetName] = {
      ok: goodRecords.filter(filter).length,
      error: badRecords.filter(filter).length,
    };
  });
  
  return { 
    records: goodRecords,
    errors: badRecords,
    sheetResults,
  };
}
