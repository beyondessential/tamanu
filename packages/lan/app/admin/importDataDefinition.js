import { log } from '../logging';
import { readDataDefinition, convertNameToCode } from '~/dataDefinitionImporter';

import { sendSyncRequest } from './sendSyncRequest';

const referenceDataTransformer = type => (item) => {
  const { name } = item;
  const code = (item.code && `${item.code}`) || convertNameToCode(name);

  return {
    recordType: 'referenceData',
    data: {
      id: `ref/${type}/${code}`,
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
  // Disabled as they are not supported in mobile yet
  triagereasons: null, // referenceDataTransformer('triageReason'),
  imagingtypes: null, // referenceDataTransformer('imagingType'),
  procedures: null, // referenceDataTransformer('procedureType'),
  // TODO
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

  await sendSyncRequest('reference', records);
}
