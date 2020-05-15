import { readFile, utils } from 'xlsx';
import { log } from '~/logging';

const sanitise = string => string.trim().replace(/[^A-Za-z]+/g, '');

const convertSheetNameToImporterId = sheetName => sanitise(sheetName).toLowerCase();
const convertNameToCode = name => sanitise(name).toUpperCase();

const referenceDataImporter = type => async ({ ReferenceData }, item) => {
  const { name } = item;
  const code = item.code || convertNameToCode(name);

  // update item with same code if it already exists
  const existing = await ReferenceData.findOne({ where: { code, type } });
  if (existing) {
    await existing.update({ name });
    return {
      success: true,
      created: false,
      object: existing,
    };
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
  if (existing) {
    return {
      email,
      success: false,
      error: `User (${email}) cannot be updated via bulk import`,
    };
  }

  const { name: displayName, ...details } = item;
  log.warn('Creating user with temporary hardcoded password!');
  const obj = await User.create({
    displayName,
    password: '123455',
    ...details,
  });

  return {
    success: true,
    created: true,
    object: obj,
  };
};

const patientImporter = async ({ Patient, ReferenceData }, item) => {
  const { 
    displayId,
    dateOfBirth: dateOfBirthString,
    age,
    village,
    ...rest
  } = item;

  // parse date of birth to actual date
  // or allow age column instead?
  // TODO
  const dateOfBirth = new Date(dateOfBirthString);
  
  // get village FK
  // TODO
  const villageId = 0;

  const data = {
    displayId,
    villageId,
    dateOfBirth,
  };

  const existing = await Patient.findOne({ where: { displayId } });
  if(existing) {
    // update & return
    await existing.update(data);
    return {
      success: true,
      created: false,
      object: existing,
    };
  }

  const object = await Patient.create(data);
  return { 
    success: true,
    created: true,
    object 
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
  paitents: patientImporter,
  // TODO
  // labtesttypes: labTestTypesImporter,
};

export async function importJson(models, sheetName, data) {
  const importerId = convertSheetNameToImporterId(sheetName);
  const importer = importers[importerId];
  if (!importer) {
    return {
      type: importerId,
      sheetName,
      created: 0,
      updated: 0,
      errors: [`No such importer: ${importerId}`],
    };
  }

  const results = [];
  for (let i = 0; i < data.length; ++i) {
    const item = data[i];
    const index = parseInt(i, 10) + 1;
    try {
      results.push({
        index,
        ...(await importer(models, item)),
      });
    } catch (e) {
      results.push({
        error: e.message,
        success: false,
        index,
      });
    }
  }

  return {
    type: importerId,
    sheetName,
    total: results.length,
    updated: results.filter(x => x.success && !x.created).length,
    created: results.filter(x => x.success && x.created).length,
    errors: results.filter(x => !x.success).map(x => `${x.index}: ${x.error}`),
  };
}

const importerPriorities = ['patients'];

// Run all non-prioritised importers FIRST, and then the prioritised importers
// in order. (the reason we care about running order is to ensure foreign keys
// work - eg a patient's village must exist before we can import the patient!
// so "non-prioritised" basically means "no FK dependencies")
const compareImporterPriority = ({ importerId: idA }, { importerId: idB }) => {
  const priorityA = importerPriorities.indexOf(idA);
  const priorityB = importerPriorities.indexOf(idB);
  const delta = priorityA - priorityB;
  if(delta) return delta;

  return idA.localeCompare(idB);
};

export async function importDataDefinition(models, path, onSheetImported) {
  const workbook = readFile(path);
  const sheets = Object.entries(workbook.Sheets).map(([sheetName, sheet]) => ({
    sheetName,
    sheet,
    importerId: convertSheetNameToImporterId(sheetName),
  }));

  sheets.sort(compareImporterPriority);

  // import things serially just so we're not spamming the same
  // table of the database with a bunch of parallel imports
  for (let i = 0; i < sheets.length; ++i) {
    const { sheetName, sheet } = sheets[i];
    const data = utils.sheet_to_json(sheet);
    const sheetResult = await importJson(models, sheetName, data);

    if (onSheetImported) {
      onSheetImported(sheetResult);
    }
  }
}
