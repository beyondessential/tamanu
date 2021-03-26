import { readFile, utils } from 'xlsx';
import { log } from '../logging';

const sanitise = string => string.trim().replace(/[^A-Za-z0-9]+/g, '');
const convertSheetNameToImporterId = sheetName => sanitise(sheetName).toLowerCase();
const convertNameToCode = name => sanitise(name).toUpperCase();

const referenceDataTransformer = type => item => {
  const { name } = item;
  const code = (item.code && `${item.code}`) || convertNameToCode(name);

  return {
    recordType: 'referenceData',
    data: {
      // TODO: replace with '-' separator
      id: `ref/${type}/${code}`,
      ...item,
      code,
      type,
    },
  };
};

const makeTransformer = (sheetName, transformer) => ({ 
  sheetName,
  transformer
});

const transformers = [
  makeTransformer('facilities', referenceDataTransformer('facilities')),
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
  const sheetResults = {};

  // then restructure the parsed data to sync record format
  const records = transformers
    .map(({ sheetName, transformer }) => {
      if(whitelist.length > 0 && !lowercaseWhitelist.includes(sheetName.toLowerCase())) {
        return [];
      }
      const sheet = sheets[sheetName.toLowerCase()];
      if(!sheet) {
        return [];
      }
      if(!transformer) {
        sheetResults[sheetName] = { 
          error: 'Not implemented yet',
        };
        return [];
      }
      const data = utils.sheet_to_json(sheet);
      sheetResults[sheetName] = { count: data.length };

      return data.map(transformer);
    })
    .filter(x => x)
    .flat();

  return { 
    records,
    sheetResults,
  };
}
