import { readFile, utils } from 'xlsx';
import { log } from 'shared/services/logging';

const sanitise = string => string.trim().replace(/[^A-Za-z0-9]+/g, '');

const recordTransformer = type => item => ({
  recordType: type,
  data: {
    ...item,
  },
});

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

// define as an array so that we can make guarantees about order
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
  makeTransformer('users', recordTransformer('user')),
  makeTransformer('patients', recordTransformer('patient')),
  makeTransformer('labTestTypes', recordTransformer('labTestType')),
  makeTransformer('roles', null),
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

  // set up the importer
  const importSheet = (sheetName, transformer) => {
    const sheet = sheets[sheetName.toLowerCase()];
    const data = utils.sheet_to_json(sheet);

    return data.map(item => {
      const transformed = transformer(item);
      if(!transformed) return null;
      return {
        sheet: sheetName,
        row: (item.__rowNum__ + 1), // account for 0-based js vs 1-based excel
        ...transformed,
      };
    });
  };

  // figure out which transformers we're actually using
  const lowercaseWhitelist = whitelist.map(x => x.toLowerCase());
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
  return activeTransformers
    .map(({ sheetName, transformer }) => importSheet(sheetName, transformer))
    .flat()
    .filter(x => x);
}
