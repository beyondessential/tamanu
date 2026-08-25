import { randomInt } from 'crypto';
import { isFunction, kebabCase, snakeCase, startCase } from 'es-toolkit/compat';
import Chance from 'chance';
import Sequelize from 'sequelize';
import { inspect } from 'util';
import { formatISO9075 } from 'date-fns';
import {
  ADMINISTRATION_FREQUENCIES,
  ATTENDANT_OF_BIRTH_TYPES,
  DRUG_UNIT_VALUES,
  BIRTH_DELIVERY_TYPES,
  BIRTH_TYPES,
  BLOOD_TYPES,
  CURRENTLY_AT_TYPES,
  DAYS_OF_WEEK,
  DIAGNOSIS_CERTAINTY_VALUES,
  DRUG_ROUTE_VALUES,
  EDUCATIONAL_ATTAINMENT_TYPES,
  ENCOUNTER_TYPE_VALUES,
  IMAGING_REQUEST_STATUS_TYPES,
  INJECTION_SITE_VALUES,
  INVOICE_INSURER_PAYMENT_STATUSES,
  INVOICE_PAYMENT_STATUSES,
  INVOICE_STATUSES,
  LAB_REQUEST_STATUSES,
  MANNER_OF_DEATHS,
  MARITAL_STATUS_VALUES,
  MEDICATION_DURATION_UNITS,
  NOTE_TYPE_VALUES,
  PLACE_OF_BIRTH_TYPES,
  PLACE_OF_DEATHS,
  PREGNANCY_MOMENTS,
  PROGRAM_DATA_ELEMENT_TYPE_VALUES,
  REFERENCE_TYPE_VALUES,
  REFERENCE_TYPES,
  REGISTRATION_STATUSES,
  REPEAT_FREQUENCY,
  REPEAT_FREQUENCY_VALUES,
  SEX_VALUES,
  STATUS_COLOR,
  TASK_DURATION_UNIT,
  TASK_FREQUENCY_UNIT,
  TITLES,
  VACCINE_CATEGORIES_VALUES,
  VACCINE_RECORDING_TYPES,
  VACCINE_STATUS,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { toDateString, toDateTimeString } from '@tamanu/utils/dateTime';
import { fakeUUID } from '@tamanu/utils/generateId';
import {
  FhirAddress,
  FhirAnnotation,
  FhirCodeableConcept,
  FhirContactPoint,
  FhirExtension,
  FhirHumanName,
  FhirIdentifier,
  FhirImmunizationPerformer,
  FhirImmunizationProtocolApplied,
  FhirPatientLink,
  FhirReference,
} from '@tamanu/shared/services/fhirTypes';
import { Model } from '@tamanu/database/models/Model';
import {
  ALLERGY_NOTES,
  CONDITION_NOTES,
  DEATH_CAUSE_NOTES,
  DEPARTMENT_NAMES,
  DISCHARGE_NOTES,
  ENCOUNTER_REASONS,
  IMAGING_RESULT_DESCRIPTIONS,
  INVOICE_DISCOUNT_REASONS,
  INVOICE_NOTES,
  INVOICE_PRODUCT_NAMES,
  LAB_RESULT_INTERPRETATIONS,
  LOCATION_GROUP_NAMES,
  LOCATION_NAMES,
  NOTE_CONTENTS,
  PAUSE_NOTES,
  PRESCRIPTION_INDICATIONS,
  PRESCRIPTION_NOTES,
  PROCEDURE_COMPLETED_NOTES,
  PROCEDURE_NOTES,
  PROGRAM_DATA_ELEMENTS,
  PROGRAM_DATA_ELEMENT_HINTS,
  PROGRAM_NAMES,
  PROGRAM_REGISTRY_CLINICAL_STATUS_NAMES,
  PROGRAM_REGISTRY_CONDITION_NAMES,
  PROGRAM_REGISTRY_NAMES,
  QUALITATIVE_LAB_RESULTS,
  REFERENCE_DATA_NAMES,
  REGISTRATION_CHANGE_REASONS,
  REPORT_DEFINITION_NAMES,
  SCHEDULED_VACCINE_DOSE_LABELS,
  SCHEDULED_VACCINE_LABELS,
  SURVEY_NAMES,
  SURVEY_SCREEN_COMPONENT_PROMPTS,
  TASK_NOTES,
  VACCINES,
} from './names.js';

// this file is most commonly used within tests, but also outside them
// jest won't always be defined, in which case we can use a random seed
export const chance = new Chance(global.jest?.getSeed() ?? randomInt(2 ** 42));

const shuffledPools = new Map<string[], string[]>();

// Cycles a pool in shuffled order, so a seeded database shows a spread of names
// instead of the same handful repeated.
const pickDistinct = (pool: string[]): string => {
  let remaining = shuffledPools.get(pool);
  if (!remaining?.length) {
    remaining = chance.shuffle([...pool]);
    shuffledPools.set(pool, remaining);
  }
  return remaining.pop();
};

// Several of these models hold a unique index on code, so names alone can't fill it.
const codeFor = (name: string) => `${kebabCase(name).slice(0, 40)}-${chance.hash({ length: 8 })}`;

// Callers resolve the name first, so the code always matches the name that is stored.
const named = (name: string) => ({ name, code: codeFor(name) });

const referenceDataName = (type: string) => {
  const pool = REFERENCE_DATA_NAMES[type];
  if (!pool) return `${startCase(type)} ${chance.integer({ min: 1, max: 99 })}`;
  return pickDistinct(pool);
};

export function fakeScheduledVaccine(prefix: string = 'test-') {
  const id = fakeUUID();
  return {
    id: `${prefix}scheduledVaccine_${id}`,
    weeksFromBirthDue: chance.pickone([0, 6, 10, 14, 24, 36, 52, 78, 104, 260]),
    weeksFromLastVaccinationDue: null,
    index: chance.integer({ min: 0, max: 50 }),
    vaccineId: null,
    visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    sortIndex: 0,
    category: chance.pickone(VACCINE_CATEGORIES_VALUES),
    label: chance.pickone(SCHEDULED_VACCINE_LABELS),
    doseLabel: chance.pickone(SCHEDULED_VACCINE_DOSE_LABELS),
  };
}

export function fakeSurvey(prefix: string = 'test-') {
  const id = fakeUUID();
  return {
    id: `${prefix}survey_${id}`,
    programId: null,
    surveyType: 'programs',
    isSensitive: false,
    code: `SRV-${chance.hash({ length: 6 }).toUpperCase()}`,
    name: chance.pickone(SURVEY_NAMES),
  };
}

export function fakeSurveyScreenComponent(prefix: string = 'test-') {
  const id = fakeUUID();
  const { text, detail } = chance.pickone(SURVEY_SCREEN_COMPONENT_PROMPTS);
  return {
    id: `${prefix}surveyScreenComponent_${id}`,
    surveyId: null,
    dataElementId: null,
    screenIndex: chance.integer({ min: 0, max: 5 }),
    componentIndex: chance.integer({ min: 0, max: 10 }),
    options: '{"foo":"bar"}',
    calculation: '',
    text,
    visibilityCriteria: '',
    validationCriteria: '',
    detail,
    config: '{}',
  };
}

export function fakeProgramDataElement(prefix: string = 'test-') {
  const id = fakeUUID();
  const { name, indicator } = chance.pickone(PROGRAM_DATA_ELEMENTS);
  return {
    id: `${prefix}programDataElement_${id}`,
    type: chance.pickone(PROGRAM_DATA_ELEMENT_TYPE_VALUES),
    code: `PDE-${chance.hash({ length: 6 }).toUpperCase()}`,
    name,
    indicator,
    defaultText: chance.pickone(PROGRAM_DATA_ELEMENT_HINTS),
    defaultOptions: '',
  };
}

export function fakeReferenceData(prefix: string = 'test-') {
  const id = fakeUUID();
  const type = chance.pickone(REFERENCE_TYPE_VALUES);
  const name = referenceDataName(type);
  return {
    id: `${prefix}referenceData_${id}`,
    type,
    visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    name,
    code: codeFor(name),
  };
}

export function fakeUser(prefix: string = 'test-') {
  const id = fakeUUID();
  const firstName = chance.first();
  const lastName = chance.last();
  return {
    id: `${prefix}user_${id}`,
    displayId: chance.hash({ length: 5 }).toUpperCase(),
    email: chance.email(),
    displayName: `${firstName} ${lastName}`,
    role: 'practitioner',
  };
}

export function fakeProgram(prefix: string = 'test-') {
  const id = fakeUUID();
  return {
    id: `${prefix}program_${id}`,
    name: chance.pickone(PROGRAM_NAMES),
    code: `PRG-${chance.hash({ length: 6 }).toUpperCase()}`,
  };
}

export function fakeAdministeredVaccine(prefix: string = 'test-', scheduledVaccineId) {
  const id = fakeUUID();
  return {
    id: `${prefix}administeredVaccine_${id}`,
    encounterId: null,
    scheduledVaccineId,
    date: formatISO9075(fakeDate()),
    batch: `${chance.character({ alpha: true }).toUpperCase()}${chance.natural({ min: 1000, max: 9999 })}`,
    status: chance.pickone(Object.values(VACCINE_RECORDING_TYPES)),
    reason: chance.pickone([
      'Routine schedule',
      'Catch-up',
      'Post-exposure',
      'Travel requirement',
      'Outbreak response',
      'School entry requirement',
      'Occupational health',
      'Maternal immunisation',
      'Campaign',
      '',
    ]),
  };
}

export function fakeEncounter(prefix: string = 'test-') {
  const id = fakeUUID();
  const startDate = fakeDate();
  const endDate = new Date(startDate.getTime() + chance.integer({ min: 1, max: 14 }) * 86400000);
  return {
    deviceId: null,
    surveyResponses: [],
    administeredVaccines: [],
    encounterType: chance.pickone(ENCOUNTER_TYPE_VALUES),
    startDate: formatISO9075(startDate),
    endDate: formatISO9075(endDate),
    id: `${prefix}encounter_${id}`,
    reasonForEncounter: chance.pickone(ENCOUNTER_REASONS),
  };
}

export function fakeSurveyResponse(prefix: string = 'test-') {
  const id = fakeUUID();
  const startTime = fakeDate();
  const endTime = new Date(startTime.getTime() + chance.integer({ min: 1, max: 60 }) * 60000);
  return {
    answers: [],
    encounterId: null,
    surveyId: null,
    startTime: toDateTimeString(startTime),
    endTime: toDateTimeString(endTime),
    result: Math.round(chance.floating({ min: 0, max: 100 }) * 10) / 10,
    id: `${prefix}surveyResponse_${id}`,
  };
}

export function fakeSurveyResponseAnswer(prefix: string = 'test-') {
  const id = fakeUUID();
  const clampedNormal = (mean: number, dev: number, min: number, max: number, decimals = 0) => {
    const val = Math.max(min, Math.min(max, chance.normal({ mean, dev })));
    return decimals > 0 ? val.toFixed(decimals) : Math.round(val).toString();
  };
  const SURVEY_ANSWER_OPTIONS: Array<{ name: string; body: () => string }> = [
    {
      name: 'Blood pressure',
      body: () => `${clampedNormal(120, 15, 80, 180)}/${clampedNormal(80, 10, 40, 110)}`,
    },
    { name: 'Temperature', body: () => clampedNormal(37.0, 0.5, 35.5, 41.0, 1) },
    { name: 'Weight', body: () => clampedNormal(70, 15, 30, 150, 1) },
    { name: 'Height', body: () => clampedNormal(165, 10, 140, 200) },
    { name: 'Heart rate', body: () => clampedNormal(75, 12, 40, 150) },
    { name: 'SpO2', body: () => `${clampedNormal(97, 2, 85, 100)}%` },
    { name: 'Respiratory rate', body: () => clampedNormal(16, 3, 10, 35) },
    { name: 'Blood glucose', body: () => clampedNormal(5.5, 2.0, 2.0, 20.0, 1) },
    { name: 'MUAC', body: () => clampedNormal(25, 4, 10, 35, 1) },
    { name: 'Pain score', body: () => clampedNormal(3, 2.5, 0, 10) },
    { name: 'Haemoglobin', body: () => clampedNormal(13.0, 2.0, 5.0, 19.0, 1) },
    { name: 'Gestational age (weeks)', body: () => clampedNormal(28, 8, 4, 42) },
    { name: 'Fundal height', body: () => clampedNormal(28, 7, 12, 42) },
    { name: 'Malaria RDT', body: () => chance.pickone(['Positive', 'Negative']) },
    {
      name: 'HIV test result',
      body: () => chance.pickone(['Reactive', 'Non-reactive', 'Indeterminate']),
    },
    {
      name: 'Oedema',
      body: () => chance.pickone(['None', 'Mild (+)', 'Moderate (++)', 'Severe (+++)']),
    },
    {
      name: 'Notes',
      body: () =>
        chance.pickone([
          'Patient reports feeling better',
          'No complaints today',
          'Mild discomfort noted',
          'Awaiting lab results',
          'Referred for further investigation',
          'Condition stable, continue treatment',
          'Patient counselled on medication adherence',
          'Wound healing well',
        ]),
    },
  ];
  const answer = chance.pickone(SURVEY_ANSWER_OPTIONS);
  const { name } = answer;
  const body = answer.body();
  return {
    id: `${prefix}surveyResponseAnswer_${id}`,
    dataElementId: null,
    responseId: null,
    name,
    body,
  };
}

export function fakeEncounterDiagnosis(prefix: string = 'test-') {
  const id = fakeUUID();
  return {
    certainty: chance.pickone(DIAGNOSIS_CERTAINTY_VALUES),
    date: formatISO9075(fakeDate()),
    isPrimary: chance.bool(),
    encounterId: null,
    diagnosisId: null,
    id: `${prefix}encounterDiagnosis_${id}`,
  };
}

export function fakePrescription(prefix: string = 'test-') {
  const id = fakeUUID();
  const date = fakeDate();
  const endDate = new Date(date.getTime() + chance.integer({ min: 1, max: 30 }) * 86400000);
  return {
    date: formatISO9075(date),
    endDate: formatISO9075(endDate),
    id: `${prefix}prescription_${id}`,
    note: chance.pickone(PRESCRIPTION_NOTES),
    indication: chance.pickone(PRESCRIPTION_INDICATIONS),
    route: chance.pickone(DRUG_ROUTE_VALUES),
  };
}

const CURRENT_YEAR = new Date().getFullYear();
export const fakeDate = () =>
  chance.date({ year: chance.integer({ min: CURRENT_YEAR - 5, max: CURRENT_YEAR }) }) as Date;
export const fakeString = (model: typeof Model, { fieldName }, id: string) =>
  `${model.name}.${fieldName}.${id}`;
export const fakeDateTimeString = () => toDateTimeString(fakeDate());
export const fakeDateString = () => toDateString(fakeDate());
export const fakeInt = () => chance.integer({ min: 0, max: 10 });
export const fakeFloat = () => chance.floating({ min: 0, max: 1000, fixed: 2 });
export const fakeBool = () => chance.bool();

const FIELD_HANDLERS = {
  'TIMESTAMP WITH TIME ZONE': fakeDate,
  'TIMESTAMP WITHOUT TIME ZONE': fakeDate,
  DATETIME: fakeDate,
  TIMESTAMP: fakeDate,

  // custom type used for datetime string storage
  date_time_string: fakeDateTimeString,
  DATETIMESTRING: fakeDateTimeString,
  // custom type used for date string storage
  date_string: fakeDateString,
  DATESTRING: fakeDateString,

  'VARCHAR(19)': fakeDateString, // VARCHAR(19) are used for date string storage
  'VARCHAR(255)': fakeString,

  // fallback for all other varchar lengths
  'VARCHAR(N)': (model: typeof Model, attrs: any, id: string, length: number) =>
    fakeString(model, attrs, id).slice(0, length),

  TEXT: fakeString,
  INTEGER: fakeInt,
  FLOAT: fakeFloat,
  DECIMAL: fakeFloat,
  'TINYINT(1)': fakeBool,
  BOOLEAN: fakeBool,
  ENUM: (_, { type }) => chance.pickone(type.values),
  UUID: () => fakeUUID(),
};

const IGNORED_FIELDS = ['createdAt', 'updatedAt', 'deletedAt', 'updatedAtSyncTick'];

const MODEL_SPECIFIC_OVERRIDES = {
  Facility: ({ name: passedName }) => {
    const facilityType = chance.pickone([
      'hospital',
      'clinic',
      'health_centre',
      'aid_post',
      'dispensary',
      'district_hospital',
      'provincial_hospital',
      'urban_clinic',
    ]);
    const namePrefixGenerators = [
      () => chance.city(),
      () => `${chance.last()} Memorial`,
      () => `St. ${chance.first()}`,
      () => `${chance.city()} District`,
      () => 'Central',
      () => 'National',
      () => `Port ${chance.last()}`,
      () => chance.company(),
    ];
    const namePrefix = chance.pickone(namePrefixGenerators)();
    const nameSuffix = {
      hospital: 'Hospital',
      clinic: 'Clinic',
      health_centre: 'Health Centre',
      aid_post: 'Aid Post',
      dispensary: 'Dispensary',
      district_hospital: 'District Hospital',
      provincial_hospital: 'Provincial Hospital',
      urban_clinic: 'Urban Clinic',
    }[facilityType];
    return {
      ...named(passedName ?? `${namePrefix} ${nameSuffix}`),
      email: chance.email(),
      contactNumber: chance.phone(),
      streetAddress: chance.address(),
      cityTown: chance.city(),
      division: chance.province({ full: true }),
      type: facilityType,
    };
  },
  ImagingRequest: () => {
    const status = chance.pickone(Object.values(IMAGING_REQUEST_STATUS_TYPES));
    const isCancelled = status === IMAGING_REQUEST_STATUS_TYPES.CANCELLED;
    return {
      status,
      reasonForCancellation: isCancelled ? chance.pickone(['duplicate', 'entered-in-error']) : null,
    };
  },
  LabTestType: () => {
    const suffix = chance.hash({ length: 4 });
    const {
      code: baseCode,
      name: baseName,
      unit,
    } = chance.pickone([
      { code: 'WBC', name: 'White Blood Cell Count', unit: 'x10^9/L' },
      { code: 'RBC', name: 'Red Blood Cell Count', unit: 'x10^12/L' },
      { code: 'HGB', name: 'Haemoglobin', unit: 'g/dL' },
      { code: 'HCT', name: 'Haematocrit', unit: '%' },
      { code: 'PLT', name: 'Platelet Count', unit: 'x10^9/L' },
      { code: 'MCV', name: 'Mean Corpuscular Volume', unit: 'fL' },
      { code: 'GLU', name: 'Blood Glucose', unit: 'mmol/L' },
      { code: 'HbA1c', name: 'Glycated Haemoglobin', unit: '%' },
      { code: 'CREAT', name: 'Creatinine', unit: 'umol/L' },
      { code: 'BUN', name: 'Blood Urea Nitrogen', unit: 'mmol/L' },
      { code: 'ALT', name: 'Alanine Aminotransferase', unit: 'IU/L' },
      { code: 'AST', name: 'Aspartate Aminotransferase', unit: 'IU/L' },
      { code: 'ALP', name: 'Alkaline Phosphatase', unit: 'IU/L' },
      { code: 'TBIL', name: 'Total Bilirubin', unit: 'umol/L' },
      { code: 'TSH', name: 'Thyroid Stimulating Hormone', unit: 'mIU/L' },
      { code: 'CRP', name: 'C-Reactive Protein', unit: 'mg/L' },
      { code: 'ESR', name: 'Erythrocyte Sedimentation Rate', unit: 'mm/hr' },
      { code: 'Na', name: 'Sodium', unit: 'mmol/L' },
      { code: 'K', name: 'Potassium', unit: 'mmol/L' },
      { code: 'Cl', name: 'Chloride', unit: 'mmol/L' },
      { code: 'Ca', name: 'Calcium', unit: 'mmol/L' },
      { code: 'CHOL', name: 'Total Cholesterol', unit: 'mmol/L' },
      { code: 'TRIG', name: 'Triglycerides', unit: 'mmol/L' },
      { code: 'UA', name: 'Uric Acid', unit: 'umol/L' },
      { code: 'mRDT', name: 'Malaria Rapid Diagnostic Test', unit: '' },
      { code: 'HIV-Ab', name: 'HIV Antibody Screen', unit: '' },
      { code: 'HBsAg', name: 'Hepatitis B Surface Antigen', unit: '' },
      { code: 'URINE-MC', name: 'Urine Microscopy & Culture', unit: '' },
    ]);
    const code = `${baseCode}-${suffix}`;
    const name = `${baseName} (${suffix})`;
    return {
      code,
      name,
      unit,
      isSensitive: false,
      externalCode: chance.pickone([code, null]),
      availableFacilities: null,
      rangeText: null,
      options: null,
    };
  },
  LabTestPanel: () => ({
    availableFacilities: null,
  }),
  LabRequest: () => {
    const status = chance.pickone(Object.values(LAB_REQUEST_STATUSES));
    const isCancelled = status === LAB_REQUEST_STATUSES.CANCELLED;
    return {
      status,
      sampleId: `S${chance.natural({ min: 1000000, max: 9999999 })}`,
      senaiteId: null,
      resultsInterpretation: chance.pickone(LAB_RESULT_INTERPRETATIONS),
      reasonForCancellation: isCancelled ? chance.pickone(['duplicate', 'entered-in-error']) : null,
    };
  },
  LabTest: () => ({
    result: chance.bool()
      ? chance.floating({ min: 0, max: 200, fixed: 1 }).toString()
      : chance.pickone(QUALITATIVE_LAB_RESULTS),
    laboratoryOfficer: chance.name(),
    secondaryResult: null,
    verification: chance.pickone(['Verified', 'Pending verification', 'Repeat requested']),
    referenceRangeMin: null,
    referenceRangeMax: null,
    referenceRangeText: null,
  }),
  Patient: () => {
    const sex = chance.pickone(Object.values(SEX_VALUES));
    const nameGender: 'male' | 'female' =
      sex === 'male' || sex === 'female' ? sex : chance.pickone(['male', 'female']);
    return {
      displayId: chance
        .hash({ length: 4 })
        .toUpperCase()
        .concat(chance.integer({ min: 10000000, max: 99999999 }).toString()),
      sex,
      firstName: chance.first({ gender: nameGender }),
      middleName: chance.first({ gender: nameGender }),
      lastName: chance.last(),
      culturalName: chance.first({ gender: nameGender }),
      dateOfBirth: toDateString(chance.birthday({ type: 'adult' }) as Date),
      dateOfDeath: null,
      email: chance.email(),
    };
  },
  PatientAdditionalData: ({ id, patientId }) => {
    const commonId = id || patientId || fakeUUID();
    return {
      id: commonId,
      patientId: commonId,
      placeOfBirth: chance.city(),
      bloodType: chance.pickone(Object.values(BLOOD_TYPES)),
      primaryContactNumber: chance.phone(),
      secondaryContactNumber: chance.phone(),
      maritalStatus: chance.pickone(Object.values(MARITAL_STATUS_VALUES)),
      cityTown: chance.city(),
      streetVillage: chance.street(),
      educationalLevel: chance.pickone(Object.values(EDUCATIONAL_ATTAINMENT_TYPES)),
      socialMedia: `@${chance.first().toLowerCase()}${chance.last().toLowerCase()}${chance.integer({ min: 1, max: 99 })}`,
      title: chance.pickone(Object.values(TITLES)),
      insurerPolicyNumber: `POL${chance.natural({ min: 100000, max: 999999 })}`,
      birthCertificate: `BC${chance.natural({ min: 1000000, max: 9999999 })}`,
      drivingLicense: `L${chance.natural({ min: 100000, max: 999999 })}`,
      passport:
        chance.character({ alpha: true }).toUpperCase() +
        chance.natural({ min: 10000000, max: 99999999 }).toString(),
      emergencyContactName: chance.name(),
      emergencyContactNumber: chance.phone(),
      secondaryVillageId: null,
      updatedAtByField: null, // this is to allow the trigger to properly populate it
    };
  },
  PatientFacility: ({ patientId = fakeUUID(), facilityId = fakeUUID() }) => {
    return {
      id: `${patientId};${facilityId}`,
      patientId,
      facilityId,
    };
  },
  PatientDeathData: () => {
    const options = ['yes', 'no', 'unknown', null];
    return {
      wasPregnant: chance.pickone(options),
      pregnancyContributed: chance.pickone(options),
      recentSurgery: chance.pickone(options),
      stillborn: chance.pickone(options),
      autopsyRequested: chance.pickone(options),
      autopsyFindingsUsed: chance.pickone(options),
      multiplePregnancy: chance.pickone(options),
      manner: chance.pickone(Object.values(MANNER_OF_DEATHS)),
      mannerOfDeathDescription: chance.pickone(DEATH_CAUSE_NOTES),
      externalCauseNotes: chance.pickone(DEATH_CAUSE_NOTES),
      externalCauseLocation: chance.pickone(Object.values(PLACE_OF_DEATHS)),
      pregnancyMoment: chance.pickone(Object.keys(PREGNANCY_MOMENTS)),
      motherConditionDescription: chance.pickone([
        'Healthy at time of birth',
        'Pre-eclampsia during pregnancy',
        'Gestational diabetes',
        'Anaemia in third trimester',
      ]),
    };
  },
  PatientProgramRegistrationCondition: () => ({
    reasonForChange: chance.pickone(REGISTRATION_CHANGE_REASONS),
  }),
  PatientProgramRegistration: ({ patientId, programRegistryId }) => ({
    id: `${patientId.replaceAll(';', ':')};${programRegistryId.replaceAll(';', ':')}`,
    registrationStatus: REGISTRATION_STATUSES.ACTIVE,
  }),
  Prescription: () => ({
    frequency: chance.pickone(Object.values(ADMINISTRATION_FREQUENCIES)),
    notes: chance.pickone(PRESCRIPTION_NOTES),
    indication: chance.pickone(PRESCRIPTION_INDICATIONS),
    route: chance.pickone(DRUG_ROUTE_VALUES),
    durationUnit: chance.pickone(Object.values(MEDICATION_DURATION_UNITS)),
    dosingUnit: chance.pickone(DRUG_UNIT_VALUES),
    dispensingUnit: chance.pickone(DRUG_UNIT_VALUES),
    discontinuingReason: null,
    discontinuedDate: null,
    discontinued: false,
    endDate: null,
    idealTimes: null,
    pharmacyNotes: null,
  }),
  User: () => ({
    email: chance.email({ length: 20 }),
    phoneNumber: chance.phone(),
    displayId: chance.hash({ length: 5 }),
    displayName: chance.name(),
    role: 'practitioner',
    kind: 'user',
  }),
  ReferenceData: ({ type, name }) => {
    const resolvedType = type ?? chance.pickone(REFERENCE_TYPE_VALUES);
    return {
      type: resolvedType,
      ...named(name ?? referenceDataName(resolvedType)),
      availableFacilities: null,
    };
  },
  Department: ({ name }) => named(name ?? pickDistinct(DEPARTMENT_NAMES)),
  LocationGroup: ({ name }) => named(name ?? pickDistinct(LOCATION_GROUP_NAMES)),
  Discharge: () => ({
    note: chance.pickone(DISCHARGE_NOTES),
    facilityName: null,
    facilityAddress: null,
    facilityTown: null,
  }),
  EncounterHistory: () => ({
    encounterType: chance.pickone(ENCOUNTER_TYPE_VALUES),
  }),
  EncounterPausePrescription: () => ({
    notes: chance.pickone(PAUSE_NOTES),
    pauseTimeUnit: chance.pickone([
      MEDICATION_DURATION_UNITS.HOURS,
      MEDICATION_DURATION_UNITS.DAYS,
    ]),
  }),
  EncounterPausePrescriptionHistory: () => ({
    notes: chance.pickone(PAUSE_NOTES),
    pauseTimeUnit: chance.pickone([
      MEDICATION_DURATION_UNITS.HOURS,
      MEDICATION_DURATION_UNITS.DAYS,
    ]),
    action: chance.pickone(['pause', 'resume']),
  }),
  ImagingResult: () => ({
    description: chance.pickone(IMAGING_RESULT_DESCRIPTIONS),
    resultImageUrl: null,
    externalCode: null,
  }),
  Invoice: () => ({
    status: chance.pickone(Object.values(INVOICE_STATUSES)),
    patientPaymentStatus: chance.pickone(Object.values(INVOICE_PAYMENT_STATUSES)),
    insurerPaymentStatus: chance.pickone(Object.values(INVOICE_INSURER_PAYMENT_STATUSES)),
    displayId: `INV${chance.natural({ min: 100000, max: 999999 })}`,
  }),
  InvoiceDiscount: () => ({
    reason: chance.pickone(INVOICE_DISCOUNT_REASONS),
  }),
  InvoiceInsurerPayment: () => ({
    status: chance.pickone(Object.values(INVOICE_INSURER_PAYMENT_STATUSES)),
    reason: chance.pickone(INVOICE_DISCOUNT_REASONS),
  }),
  InvoicePatientPayment: () => ({
    chequeNumber: `CHQ${chance.natural({ min: 10000, max: 99999 })}`,
  }),
  InvoicePayment: () => ({
    receiptNumber: `RCP${chance.natural({ min: 100000, max: 999999 })}`,
  }),
  InvoiceItem: () => {
    const product = named(pickDistinct(INVOICE_PRODUCT_NAMES));
    return {
      note: chance.pickone(INVOICE_NOTES),
      productNameFinal: product.name,
      productCodeFinal: product.code,
      sourceRecordType: null,
      sourceRecordId: null,
    };
  },
  InvoiceItemDiscount: () => ({
    reason: chance.pickone(INVOICE_DISCOUNT_REASONS),
  }),
  InvoiceProduct: ({ name }) => ({
    name: name ?? pickDistinct(INVOICE_PRODUCT_NAMES),
  }),
  PatientAllergy: () => ({
    note: chance.pickone(ALLERGY_NOTES),
  }),
  PatientBirthData: () => ({
    birthType: chance.pickone(Object.values(BIRTH_TYPES)),
    birthDeliveryType: chance.pickone(Object.values(BIRTH_DELIVERY_TYPES)),
    attendantAtBirth: chance.pickone(Object.values(ATTENDANT_OF_BIRTH_TYPES)),
    nameOfAttendantAtBirth: chance.name(),
    registeredBirthPlace: chance.pickone(Object.values(PLACE_OF_BIRTH_TYPES)),
  }),
  PatientCondition: () => ({
    note: chance.pickone(CONDITION_NOTES),
  }),
  Procedure: () => ({
    note: chance.pickone(PROCEDURE_NOTES),
    completedNote: chance.pickone(PROCEDURE_COMPLETED_NOTES),
  }),
  Program: ({ name }) => named(name ?? pickDistinct(PROGRAM_NAMES)),
  ProgramDataElement: ({ name }) => {
    const element = chance.pickone(PROGRAM_DATA_ELEMENTS);
    return {
      ...named(name ?? element.name),
      indicator: element.indicator,
      defaultText: chance.pickone(PROGRAM_DATA_ELEMENT_HINTS),
      defaultOptions: null,
      visualisationConfig: null,
    };
  },
  ProgramRegistryCondition: ({ name }) =>
    named(name ?? pickDistinct(PROGRAM_REGISTRY_CONDITION_NAMES)),
  ProgramRegistryClinicalStatus: ({ name }) => ({
    ...named(name ?? pickDistinct(PROGRAM_REGISTRY_CLINICAL_STATUS_NAMES)),
    color: chance.pickone(Object.keys(STATUS_COLOR)),
  }),
  ReportDefinition: ({ name }) => ({
    name: name ?? pickDistinct(REPORT_DEFINITION_NAMES),
  }),
  ReportDefinitionVersion: () => ({
    query: 'SELECT p.display_id, p.first_name, p.last_name FROM patients p LIMIT 100',
    notes: chance.pickone([
      'Initial draft',
      'Added facility filter',
      'Reviewed with the reporting team',
      'Date range parameter added',
    ]),
  }),
  TaskTemplate: () => ({
    frequencyUnit: chance.pickone(Object.values(TASK_FREQUENCY_UNIT)),
  }),
  Task: () => ({
    name: referenceDataName(REFERENCE_TYPES.TASK_TEMPLATE),
    frequencyUnit: chance.pickone(Object.values(TASK_FREQUENCY_UNIT)),
    durationUnit: chance.pickone(Object.values(TASK_DURATION_UNIT)),
    note: chance.pickone(TASK_NOTES),
    completedNote: chance.pickone(TASK_NOTES),
    todoNote: chance.pickone(TASK_NOTES),
  }),
  Role: () => ({
    name: `${snakeCase(chance.profession())}_${chance.hash({ length: 8 })}`,
  }),
  ScheduledVaccine: () => ({
    label: pickDistinct(SCHEDULED_VACCINE_LABELS),
    doseLabel: chance.pickone(SCHEDULED_VACCINE_DOSE_LABELS),
    category: chance.pickone(VACCINE_CATEGORIES_VALUES),
  }),
  Survey: ({ name }) => ({
    ...named(name ?? pickDistinct(SURVEY_NAMES)),
    isSensitive: false,
    visibilityCriteria: null,
    notifyEmailAddresses: [],
  }),
  SurveyScreenComponent: () => ({
    ...chance.pickone(SURVEY_SCREEN_COMPONENT_PROMPTS),
    calculation: null,
    validationCriteria: null,
    visibilityCriteria: null,
    config: null,
    options: null,
  }),
  Encounter: () => ({
    encounterType: chance.pickone(ENCOUNTER_TYPE_VALUES),
    reasonForEncounter: chance.pickone(ENCOUNTER_REASONS),
  }),
  Note: () => ({
    // This is a hack because the type of Note.id is UUID, whereas tests might create ids of the form:
    // Note.id.123e4567-e89b-12d3-a456-426614174000
    // Setting id: undefined allows the model to create a default uuid and therefore avoid erroring
    // It will be fixed properly as part of EPI-160
    id: undefined,
    noteTypeId: chance.pickone(NOTE_TYPE_VALUES),
    revisedById: undefined,
    content: chance.pickone(NOTE_CONTENTS),
  }),
  Location: ({ name }) => ({
    ...named(name ?? pickDistinct(LOCATION_NAMES)),
    maxOccupancy: chance.pickone([1, null]),
  }),
  ProgramRegistry: ({ name }) => ({
    ...named(name ?? pickDistinct(PROGRAM_REGISTRY_NAMES)),
    currentlyAtType: chance.pickone(Object.values(CURRENTLY_AT_TYPES)),
  }),
  AdministeredVaccine: () => {
    const status = chance.pickone(Object.values(VACCINE_STATUS));
    const vaccine = chance.pickone(VACCINES);
    return {
      status,
      batch: `${chance.hash({ length: 4 }).toUpperCase()}-${chance.natural({ min: 100, max: 999 })}`,
      consentGivenBy: chance.name(),
      givenBy: chance.name(),
      injectionSite: chance.pickone(Object.values(INJECTION_SITE_VALUES)),
      vaccineName: vaccine.label,
      vaccineBrand: vaccine.brand,
      disease: vaccine.disease,
      reason:
        status === VACCINE_STATUS.NOT_GIVEN
          ? referenceDataName(REFERENCE_TYPES.VACCINE_NOT_GIVEN_REASON)
          : null,
    };
  },
  AppointmentSchedule: () => {
    const frequency = chance.pickone(REPEAT_FREQUENCY_VALUES);
    const endsMode = chance.pickone(['on', 'after']);
    return {
      frequency,
      daysOfWeek: [chance.pickone(DAYS_OF_WEEK)],
      nthWeekday:
        frequency === REPEAT_FREQUENCY.MONTHLY ? chance.integer({ min: -1, max: 4 }) : null,
      ...(endsMode === 'on'
        ? { untilDate: fakeDateTimeString() }
        : { occurrenceCount: chance.integer({ min: 1, max: 99 }) }),
    };
  },
  ChangeLog: () => ({
    recordId: fakeUUID(),
    id: fakeUUID(),
    tableOid: chance.integer({ min: 10000, max: 99999 }),
    tableSchema: chance.pickone(['public', 'fhir', 'logs']),
    tableName: chance.pickone([
      'patients',
      'encounters',
      'lab_requests',
      'lab_tests',
      'imaging_requests',
      'survey_responses',
      'survey_response_answers',
      'administered_vaccines',
      'encounter_diagnoses',
      'prescriptions',
      'reference_data',
      'users',
      'patient_additional_data',
      'notes',
      'appointments',
      'locations',
    ]),
    loggedAt: fakeDateTimeString(),
    recordCreatedAt: fakeDateTimeString(),
    recordUpdatedAt: fakeDateTimeString(),
    updatedByUserId: fakeUUID(),
  }),
  SurveyResponse: () => ({
    resultText: chance.pickone([
      'Low risk',
      'Medium risk',
      'High risk',
      'Complete',
      'Follow-up required',
    ]),
    // editedTime implies “patched after original survey response submission”; must start as NULL
    editedTime: null,
  }),
  SurveyResponseAnswer: () => ({
    // editedTime implies “patched after original survey response submission”; must start as NULL
    editedTime: null,
  }),
};

const fhirArray =
  (fakeFn: (...args: any[]) => any) =>
  (...args: any[]) =>
    chance.n(() => fakeFn(...args), chance.integer({ min: 0, max: 3 }));

const FHIR_MODELS_HANDLERS = {
  FhirPatient: {
    identifier: fhirArray((...args: any[]) => FhirIdentifier.fake(...args)),
    name: fhirArray((...args: any[]) => FhirHumanName.fake(...args)),
    telecom: fhirArray((...args: any[]) => FhirContactPoint.fake(...args)),
    address: fhirArray((...args: any[]) => FhirAddress.fake(...args)),
    link: fhirArray((...args: any[]) => FhirPatientLink.fake(...args)),
    extension: fhirArray((...args: any[]) => FhirExtension.fake(...args)),
  },
  FhirServiceRequest: {
    identifier: fhirArray((...args: any[]) => FhirIdentifier.fake(...args)),
    category: fhirArray((...args: any[]) => FhirCodeableConcept.fake(...args)),
    order_detail: fhirArray((...args: any[]) => FhirCodeableConcept.fake(...args)),
    location_code: fhirArray((...args: any[]) => FhirCodeableConcept.fake(...args)),
    code: (...args: any[]) => FhirCodeableConcept.fake(...args),
    subject: (...args: any[]) => FhirReference.fake(...args),
    requester: (...args: any[]) => FhirReference.fake(...args),
  },
  FhirDiagnosticReport: {
    extension: fhirArray((...args: any[]) => FhirExtension.fake(...args)),
    identifier: fhirArray((...args: any[]) => FhirIdentifier.fake(...args)),
    code: (...args: any[]) => FhirCodeableConcept.fake(...args),
    subject: (...args: any[]) => FhirReference.fake(...args),
    performer: fhirArray((...args: any[]) => FhirReference.fake(...args)),
    result: fhirArray((...args: any[]) => FhirReference.fake(...args)),
  },
  FhirImmunization: {
    vaccine_code: (...args: any[]) => FhirCodeableConcept.fake(...args),
    patient: (...args: any[]) => FhirReference.fake(...args),
    encounter: (...args: any[]) => FhirReference.fake(...args),
    site: fhirArray((...args: any[]) => FhirCodeableConcept.fake(...args)),
    performer: fhirArray((...args: any[]) => FhirImmunizationPerformer.fake(...args)),
    protocol_applied: fhirArray((...args: any[]) => FhirImmunizationProtocolApplied.fake(...args)),
  },
  FhirImagingStudy: {
    identifier: fhirArray((...args: any[]) => FhirIdentifier.fake(...args)),
    basedOn: fhirArray((...args: any[]) => FhirReference.fake(...args)),
    note: fhirArray((...args: any[]) => FhirAnnotation.fake(...args)),
  },
};

export const fake = (
  model: typeof Model,
  passedOverrides: Record<string, any> = {},
): Record<string, any> => {
  const id = fakeUUID();
  const record = {};
  const modelOverridesFn = MODEL_SPECIFIC_OVERRIDES[model.name];
  const modelOverrides = modelOverridesFn ? modelOverridesFn(passedOverrides) : {};
  const overrides = { ...modelOverrides, ...passedOverrides };
  const overrideFields = Object.keys(overrides);

  function fakeField(name: string, attribute: any) {
    const { type, fieldName, defaultValue } = attribute;

    if (overrideFields.includes(fieldName)) {
      return overrides[fieldName];
    }

    if (attribute.references) {
      // null out id fields
      return null;
    }

    if (IGNORED_FIELDS.includes(fieldName)) {
      // ignore metadata fields
      return undefined;
    }

    if (fieldName === 'id') {
      return fakeUUID();
    }

    if (fieldName === 'visibilityStatus') {
      return VISIBILITY_STATUSES.CURRENT;
    }

    if (type instanceof Sequelize.ARRAY && (type as any).type) {
      return Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => fakeField(name, { ...attribute, type: (type as any).type }));
    }

    if (defaultValue) {
      if (defaultValue === Sequelize.NOW || defaultValue === Sequelize.UUIDV4) {
        return undefined;
      }
      return isFunction(defaultValue) ? defaultValue() : defaultValue;
    }

    if (type instanceof Sequelize.BLOB) {
      return Buffer.from('test');
    }

    if (FIELD_HANDLERS[type]) {
      return FIELD_HANDLERS[type](model, attribute, id);
    }

    if (type.type && FIELD_HANDLERS[type.type]) {
      return FIELD_HANDLERS[type.type](model, attribute, id);
    }

    if (type instanceof Sequelize.STRING && (type as any).options.length) {
      return FIELD_HANDLERS['VARCHAR(N)'](model, attribute, id, (type as any).options.length);
    }

    if (type?.key === 'JSONB' && FHIR_MODELS_HANDLERS[model.name]?.[fieldName]) {
      return FHIR_MODELS_HANDLERS[model.name][fieldName](model, attribute, id);
    }

    if (type?.key === 'JSONB') {
      return { test: 'test' };
    }

    // if you hit this error, you probably need to add a new field handler or a model-specific override
    throw new Error(
      `Could not fake field ${model.name}.${name} of type ${type} / ${type.type} / ${inspect(
        type,
      )}`,
    );
  }

  for (const [name, attribute] of Object.entries(model.getAttributes())) {
    const fakeValue = fakeField(name, attribute);
    if (fakeValue !== undefined) record[name] = fakeValue;
  }

  return record;
};
