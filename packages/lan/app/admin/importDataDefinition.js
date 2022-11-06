import { readFile, utils } from 'xlsx';
import { getJsDateFromExcel } from 'excel-date-to-js';
import moment from 'moment';

import { log } from 'shared/services/logging';
import { ENCOUNTER_TYPES, IMAGING_AREA_TYPES } from 'shared/constants';

const sanitise = string => string.trim().replace(/[^A-Za-z0-9]+/g, '');

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

// define as an array so that we can make guarantees about order
const transformers = [
  makeTransformer('facilities', recordTransformer('facility')),
  makeTransformer('villages', referenceDataTransformer('village')),
  makeTransformer('manufacturers', referenceDataTransformer('manufacturer')),
  makeTransformer('drugs', referenceDataTransformer('drug')),
  makeTransformer('allergies', referenceDataTransformer('allergy')),
  makeTransformer('departments', recordTransformer('department')),
  makeTransformer('locations', recordTransformer('location')),
  makeTransformer('diagnoses', referenceDataTransformer('icd10')),
  makeTransformer('triageReasons', referenceDataTransformer('triageReason')),
  makeTransformer(
    'xRayImagingAreas',
    referenceDataTransformer(IMAGING_AREA_TYPES.X_RAY_IMAGING_AREA),
  ),
  makeTransformer(
    'ultrasoundImagingAreas',
    referenceDataTransformer(IMAGING_AREA_TYPES.ULTRASOUND_IMAGING_AREA),
  ),
  makeTransformer(
    'ctScanImagingAreas',
    referenceDataTransformer(IMAGING_AREA_TYPES.CT_SCAN_IMAGING_AREA),
  ),
  makeTransformer(
    'echocardiogramImagingAreas',
    referenceDataTransformer(IMAGING_AREA_TYPES.ECHOCARDIOGRAM_IMAGING_AREA),
  ),
  makeTransformer('mriImagingAreas', referenceDataTransformer(IMAGING_AREA_TYPES.MRI_IMAGING_AREA)),
  makeTransformer(
    'mammogramImagingAreas',
    referenceDataTransformer(IMAGING_AREA_TYPES.MAMMOGRAM_IMAGING_AREA),
  ),
  makeTransformer('ecgImagingAreas', referenceDataTransformer(IMAGING_AREA_TYPES.ECG_IMAGING_AREA)),
  makeTransformer(
    'holterMonitorImagingAreas',
    referenceDataTransformer(IMAGING_AREA_TYPES.HOLTER_MONITOR_IMAGING_AREA),
  ),
  makeTransformer(
    'endoscopyImagingAreas',
    referenceDataTransformer(IMAGING_AREA_TYPES.ENDOSCOPY_IMAGING_AREA),
  ),
  makeTransformer(
    'fluroscopyImagingAreas',
    referenceDataTransformer(IMAGING_AREA_TYPES.FLUROSCOPY_IMAGING_AREA),
  ),
  makeTransformer(
    'angiogramImagingAreas',
    referenceDataTransformer(IMAGING_AREA_TYPES.ANGIOGRAM_IMAGING_AREA),
  ),
  makeTransformer(
    'colonoscopyImagingAreas',
    referenceDataTransformer(IMAGING_AREA_TYPES.COLONOSCOPY_IMAGING_AREA),
  ),
  makeTransformer(
    'stressTestImagingAreas',
    referenceDataTransformer(IMAGING_AREA_TYPES.STRESS_TEST_IMAGING_AREA),
  ),
  makeTransformer(
    'vascularStudyImagingAreas',
    referenceDataTransformer(IMAGING_AREA_TYPES.VASCULAR_STUDY_IMAGING_AREA),
  ),
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
  makeTransformer('religions', referenceDataTransformer('religion')),
  makeTransformer('countries', referenceDataTransformer('country')),
  makeTransformer('labTestCategories', referenceDataTransformer('labTestCategory')),
  makeTransformer('patientBillingType', referenceDataTransformer('patientBillingType')),
  makeTransformer('labTestPriorities', referenceDataTransformer('labTestPriority')),
  makeTransformer('labTestLaboratory', referenceDataTransformer('labTestLaboratory')),
  makeTransformer('labTestMethods', referenceDataTransformer('labTestMethod')),
  makeTransformer('additionalInvoiceLines', referenceDataTransformer('additionalInvoiceLine')),
  makeTransformer('users', recordTransformer('user')),
  makeTransformer('patients', patientDataTransformer),
  makeTransformer('labTestTypes', recordTransformer('labTestType')),
  makeTransformer('certifiableVaccines', recordTransformer('certifiableVaccine')),
  makeTransformer('vaccineSchedules', recordTransformer('scheduledVaccine')),
  makeTransformer('invoiceLineTypes', recordTransformer('invoiceLineType')),
  makeTransformer('invoicePriceChangeTypes', recordTransformer('invoicePriceChangeType')),
  makeTransformer('administeredVaccines', administeredVaccineTransformer()), // should go below patients, users, departments, locations
  makeTransformer('roles', null),
  makeTransformer('secondaryIdType', referenceDataTransformer('secondaryIdType')),
];

export async function importData({ file, whitelist = [] }) {
  log.info(`Importing data definitions from ${file}...`);

  // parse xlsx
  const workbook = readFile(file);
  const sheets = Object.entries(workbook.Sheets).reduce(
    (group, [sheetName, sheet]) => ({
      ...group,
      [sanitise(sheetName).toLowerCase()]: sheet,
    }),
    {},
  );

  // set up the importer
  const importSheet = (sheetName, transformer) => {
    const sheet = sheets[sheetName.toLowerCase()];
    const data = utils.sheet_to_json(sheet);

    return data
      .filter(item => Object.values(item).some(x => x))
      .map(item => {
        const transformed = transformer(item);
        if (!transformed) return null;

        // transformer can return an object or an array of object
        return [transformed].flat().map(t => ({
          sheet: sheetName,
          row: item.__rowNum__ + 1, // account for 0-based js vs 1-based excel
          ...t,
        }));
      })
      .flat();
  };

  // figure out which transformers we're actually using
  const lowercaseWhitelist = whitelist.map(x => x.toLowerCase());
  const activeTransformers = transformers.filter(({ sheetName, transformer }) => {
    if (!transformer) return false;
    if (whitelist.length > 0 && !lowercaseWhitelist.includes(sheetName.toLowerCase())) {
      return false;
    }
    const sheet = sheets[sheetName.toLowerCase()];
    if (!sheet) return false;

    return true;
  });

  // restructure the parsed data to sync record format
  return activeTransformers
    .map(({ sheetName, transformer }) => importSheet(sheetName, transformer))
    .flat()
    .filter(x => x);
}
