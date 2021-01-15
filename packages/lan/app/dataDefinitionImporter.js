import { readFile, utils } from 'xlsx';
import moment from 'moment';

import { log } from '~/logging';

const sanitise = string => string.trim().replace(/[^A-Za-z]+/g, '');

export const convertSheetNameToImporterId = sheetName => sanitise(sheetName).toLowerCase();
export const convertNameToCode = name => sanitise(name).toUpperCase();

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

const getOrCreateTestCategory = async (ReferenceData, categoryName) => {
  const existing = await ReferenceData.findOne({
    where: {
      type: 'labTestCategory',
      name: categoryName,
    },
  });

  if (existing) {
    return existing;
  }

  const created = await ReferenceData.create({
    type: 'labTestCategory',
    name: categoryName,
    code: convertNameToCode(categoryName),
  });

  return created;
};

let lastLabCategoryName = '';
const labTestTypesImporter = async ({ LabTestType, ReferenceData }, item) => {
  const { name, category, maleRange = '', femaleRange = '', ...fields } = item;

  const categoryName = category || lastLabCategoryName;
  lastLabCategoryName = categoryName;
  const categoryRecord = await getOrCreateTestCategory(ReferenceData, categoryName);

  const [maleMin, maleMax] = maleRange
    .trim()
    .split(',')
    .map(x => parseFloat(x));
  const [femaleMin, femaleMax] = femaleRange
    .trim()
    .split(',')
    .map(x => parseFloat(x));

  const code = item.code || convertNameToCode(name);
  const values = {
    labTestCategoryId: categoryRecord.id,
    code,
    name,
    maleMax,
    maleMin,
    femaleMax,
    femaleMin,
    ...fields,
  };

  const existing = await LabTestType.findOne({ where: { code } });
  if (existing) {
    await existing.update({ values });
    return {
      success: true,
      created: false,
      object: existing,
    };
  }

  const obj = await LabTestType.create(values);

  return {
    success: true,
    created: true,
    object: obj,
  };
};

function getDateFromAgeOrDob(age, rawDateOfBirth) {
  if (rawDateOfBirth && typeof rawDateOfBirth === 'number') {
    // json parser has converted a date to a timestamp for us
    // excel date serial numbers are their own thing - convert to JS date
    // https://stackoverflow.com/questions/16229494/converting-excel-date-serial-number-to-date-using-javascript
    const date = new Date(Math.round((rawDateOfBirth - 25569) * 86400 * 1000));
    return date;
  }

  if (rawDateOfBirth) {
    return moment(rawDateOfBirth, ['DD/MM/YYYY', 'YYYY/MM/DD'], true).toDate();
  }

  return moment()
    .subtract(age, 'years')
    .startOf('year')
    .toDate();
}

const patientImporter = async ({ Patient, ReferenceData }, item) => {
  const { displayId, dateOfBirth: rawDateOfBirth, age, village, ...rest } = item;

  const dateOfBirth = getDateFromAgeOrDob(age, rawDateOfBirth);

  const villageRef = await ReferenceData.findOne({
    where: {
      type: 'village',
      name: village,
    },
  });

  const data = {
    ...rest,
    displayId,
    villageId: villageRef && villageRef.id,
    dateOfBirth,
  };

  const existing = await Patient.findOne({ where: { displayId } });
  if (existing) {
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
    object,
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
  patients: patientImporter,
  labtesttypes: labTestTypesImporter,
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
      const imported = await importer(models, item);
      results.push({
        index,
        ...imported,
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
  if (delta) return delta;

  return idA.localeCompare(idB);
};

export async function readDataDefinition(path) {
  const workbook = readFile(path);
  const sheets = Object.entries(workbook.Sheets).map(([sheetName, sheet]) => ({
    sheetName,
    sheet,
    importerId: convertSheetNameToImporterId(sheetName),
  }));

  return sheets
    .sort(compareImporterPriority)
    .map(({ sheetName, sheet, ...rest }) => ({
      sheetName,
      data: utils.sheet_to_json(sheet),
      ...rest,
    }));
}

export async function importDataDefinition(models, path, onSheetImported) {
  const sheetData = await readDataDefinition(path);

  // import things serially just so we're not spamming the same
  // table of the database with a bunch of parallel imports
  for (let i = 0; i < sheetData.length; ++i) {
    const { sheetName, data } = sheetData[i];
    const sheetResult = await importJson(models, sheetName, data);

    if (onSheetImported) {
      onSheetImported(sheetResult);
    }
  }
}
