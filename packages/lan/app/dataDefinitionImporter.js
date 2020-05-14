import { readFile, utils } from 'xlsx';

const sanitise = string => string.trim().replace(/[^A-Za-z]+/g, '');

const convertSheetNameToImporterId= sheetName => sanitise(sheetName).toLowerCase();
const convertNameToCode = name => sanitise(name).toUpperCase();

const referenceDataImporter = type => async ({ ReferenceData }, item) => {
  const { name } = item;
  const code = item.code || convertNameToCode(name);

  // update item with same code if it already exists
  const existing = await ReferenceData.findOne({ where: { code, type } });
  if(existing) {
    await existing.update({ name });
    return {
      success: true,
      created: false,
      object: existing,
    }
  }

  // otherwise import it anew
  const obj = await ReferenceData.create({ name, code, type });
  return {
    success: true,
    created: true,
    object: obj,
  };
};

const userImporter = async ({ User }, item) => {
  const { email } = item;
  const existing = await User.findOne({ where: { email } });
  if(existing) {
    return { 
      email, 
      success: false,
      error: `User (${email}) cannot be updated via bulk import`,
    };
  }

  const { name: displayName, ...details } = item;
  const obj = await User.create({
    displayName,
    ...details,
  });

  return {
    success: true,
    created: true,
    object: obj,
  };
};

const importers = {
  villages: referenceDataImporter('village'),
  drugs: referenceDataImporter('drug'),
  allergies: referenceDataImporter('allergy'),
  departments: referenceDataImporter('department'),
  locations: referenceDataImporter('location'),
  diagnoses: referenceDataImporter('icd10'),
  triagereasons: referenceDataImporter('triageReason'),
  imagingtypes: referenceDataImporter('imagingType'),
  procedures: referenceDataImporter('procedureType'),
  users: userImporter,
  // TODO
  // labtesttypes: labTestTypesImporter,
};

export async function importJson(models, sheetName, data) {
  const importerId = convertSheetNameToImporterId(sheetName);
  const importer = importers[importerId];
  if(!importer) {
    return {
      type: importerId,
      errors: [`No such importer: ${importerId}`],
    };
  }

  const results = [];
  for (const j in data) {
    const item = data[j];
    const index = parseInt(j, 10) + 1;
    try {
      results.push({
        index,
        ...await importer(models, item),
      });
    } catch(e) {
      results.push({
        error: e.message,
        success: false,
        index,
      });
    }
  }

  return {
    type: importerId,
    total: results.length,
    updated: results.filter(x => x.success && !x.created).length,
    created: results.filter(x => x.success && x.created).length,
    errors: results.filter(x => !x.success).map(x => `${x.index}: ${x.error}`),
  };
}

export async function importDataDefinition(models, path) {
  const workbook = readFile(path);
  const sheets = Object.entries(workbook.Sheets);

  const importResults = [];

  // import things serially just so we're not spamming the same
  // table of the database with a bunch of parallel imports
  for (const i in sheets) {
    const [sheetName, sheet] = sheets[i];
    const data = utils.sheet_to_json(sheet);
    const results = await importJson(models, sheetName, data);

    importResults.push(results);
  }

  return importResults;
}
