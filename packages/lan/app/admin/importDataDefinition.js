import { log } from '../logging';
import { readDataDefinition, convertNameToCode } from '~/dataDefinitionImporter';

const referenceDataTransformer = type => (item) => {
  const { name } = item;
  const code = (item.code && `${item.code}`) || convertNameToCode(name);

  return {
    id: `ref/${type}/${code}`,
    recordType: 'referenceData',
    data: {
      ...item,
      code,
      type,
    }
  };
};

const transformers = {
  villages: referenceDataTransformer('village'),
  drugs: referenceDataTransformer('drug'),
  allergies: referenceDataTransformer('allergy'),
  departments: referenceDataTransformer('department'),
  locations: referenceDataTransformer('location'),
  diagnoses: referenceDataTransformer('icd10'),
  triagereasons: referenceDataTransformer('triageReason'),
  imagingtypes: referenceDataTransformer('imagingType'),
  procedures: referenceDataTransformer('procedureType'),
  users: null,
  patients: null,
  labtesttypes: null,
};

export async function importData({ file }) {
  log.info(`Importing data definitions from ${file}...`);

  // parse xlsx
  const sheetData = await readDataDefinition(file);

  // then restructure the parsed data to sync record format 
  const records = sheetData.map(sheet => {
    const transformer = transformers[sheet.importerId];
    if (!transformer) return null;
    return sheet.data.map(transformer);
  }).filter(x => x).flat();
  
  console.log(records);
  
  // then send the records to sync server
  // - idempotent?
}
