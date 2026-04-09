import { randomInt } from 'crypto';
import { isFunction, snakeCase } from 'lodash';
import Chance from 'chance';
import Sequelize, { DataTypes } from 'sequelize';
import { inspect } from 'util';
import { formatISO9075 } from 'date-fns';

import {
  ADMINISTRATION_FREQUENCIES,
  CURRENTLY_AT_TYPES,
  DAYS_OF_WEEK,
  DIAGNOSIS_CERTAINTY_VALUES,
  ENCOUNTER_TYPE_VALUES,
  IMAGING_REQUEST_STATUS_TYPES,
  LAB_REQUEST_STATUSES,
  NOTE_TYPE_VALUES,
  PROGRAM_DATA_ELEMENT_TYPE_VALUES,
  REFERENCE_TYPE_VALUES,
  REGISTRATION_STATUSES,
  REPEAT_FREQUENCY,
  REPEAT_FREQUENCY_VALUES,
  VACCINE_RECORDING_TYPES,
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
import { DRUGS } from '@tamanu/database/demoData/drugs';
import { ALLERGIES } from '@tamanu/database/demoData/allergies';
import { DIAGNOSES } from '@tamanu/database/demoData/diagnoses';
import { TRIAGE_DIAGNOSES } from '@tamanu/database/demoData/triageDiagnoses';
import { VILLAGES } from '@tamanu/database/demoData/villages';
import { PROCEDURE_TYPES } from '@tamanu/database/demoData/procedureTypes';
import {
  X_RAY_IMAGING_AREAS,
  CT_SCAN_IMAGING_AREAS,
  ULTRASOUND_IMAGING_AREAS,
} from '@tamanu/database/demoData/imagingAreas';

const DRUG_NAMES = DRUGS.map(d => d.name);
const ALLERGY_NAMES = ALLERGIES.map(a => a.name);
const DIAGNOSIS_NAMES = DIAGNOSES.map(d => d.name.split('\t')[0]);
const TRIAGE_REASON_NAMES = TRIAGE_DIAGNOSES.map(t => t.name);
const VILLAGE_NAMES = VILLAGES.map(v => v.name);
const PROCEDURE_TYPE_NAMES = PROCEDURE_TYPES.map(p => p.name.split('\t')[1] || p.name);
const X_RAY_AREA_NAMES = X_RAY_IMAGING_AREAS.map(a => a.name);
const CT_SCAN_AREA_NAMES = CT_SCAN_IMAGING_AREAS.map(a => a.name);
const ULTRASOUND_AREA_NAMES = ULTRASOUND_IMAGING_AREAS.map(a => a.name);

// this file is most commonly used within tests, but also outside them
// jest won't always be defined, in which case we can use a random seed
export const chance = new Chance(global.jest?.getSeed() ?? randomInt(2 ** 42));

export function fakeStringFields(prefix: string, fields: string[]) {
  return fields.reduce(
    (obj: Record<string, string>, field: string) => ({
      ...obj,
      [field]: prefix + field,
    }),
    {},
  );
}

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
    category: chance.pickone([
      'Routine',
      'Catch-up',
      'Travel',
      'Seasonal',
      'Supplementary',
      'Outbreak Response',
    ]),
    label: chance.pickone([
      'BCG',
      'Hepatitis B',
      'OPV',
      'IPV',
      'DTP',
      'Measles',
      'Rubella',
      'MMR',
      'Tetanus',
      'Pneumococcal',
      'Rotavirus',
      'HPV',
      'Yellow Fever',
      'Typhoid',
      'Influenza',
      'Varicella',
      'Hepatitis A',
      'Meningococcal',
      'Japanese Encephalitis',
    ]),
    doseLabel: chance.pickone([
      'Dose 1',
      'Dose 2',
      'Dose 3',
      'Dose 4',
      'Booster',
      'Birth dose',
      'Annual',
    ]),
  };
}

export function fakeSurvey(prefix: string = 'test-') {
  const id = fakeUUID();
  const surveyName = chance.pickone([
    'Maternal Health Assessment',
    'Nutrition Screening',
    'Mental Health Questionnaire',
    'Chronic Disease Follow-up',
    'Community Health Survey',
    'Immunisation Checklist',
    'Antenatal Care Visit',
    'Postnatal Care Assessment',
    'TB Screening Form',
    'Malaria Case Investigation',
    'NCD Risk Assessment',
    'Child Growth Monitoring',
    'Family Planning Counselling',
    'HIV Testing & Counselling',
    'Outbreak Investigation Form',
    'Patient Discharge Summary',
  ]);
  return {
    id: `${prefix}survey_${id}`,
    programId: null,
    surveyType: 'programs',
    isSensitive: false,
    code: `SRV-${chance.hash({ length: 6 }).toUpperCase()}`,
    name: surveyName,
  };
}

export function fakeSurveyScreenComponent(prefix: string = 'test-') {
  const id = fakeUUID();
  const { text, detail } = chance.pickone([
    { text: 'Systolic blood pressure (mmHg)', detail: 'Measure after 5 min rest, use left arm' },
    { text: 'Diastolic blood pressure (mmHg)', detail: 'Record seated reading' },
    { text: 'Temperature (°C)', detail: 'Use tympanic or oral thermometer' },
    { text: 'Weight (kg)', detail: 'Remove shoes and heavy clothing' },
    { text: 'Height (cm)', detail: 'Patient should be standing straight' },
    { text: 'Heart rate (bpm)', detail: 'Count for 60 seconds at radial pulse' },
    { text: 'Respiratory rate', detail: 'Count breaths per minute at rest' },
    { text: 'Oxygen saturation (%)', detail: 'Use pulse oximeter on index finger' },
    { text: 'Blood glucose (mmol/L)', detail: 'Record fasting or random, note which' },
    { text: 'MUAC (cm)', detail: 'Mid-upper arm circumference, left arm' },
    { text: 'Pain score (0-10)', detail: '0 = no pain, 10 = worst imaginable' },
    { text: 'Urine dipstick result', detail: 'Record protein, glucose, blood, leukocytes' },
    { text: 'Fundal height (cm)', detail: 'Measure from pubic symphysis' },
    { text: 'Oedema', detail: 'Check ankles, shins, and sacral area' },
    { text: 'Clinical notes', detail: 'Free text observations' },
    { text: 'Presenting complaint', detail: "Chief complaint in patient's own words" },
  ]);
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
  const { name: elementName, indicator } = chance.pickone([
    { name: 'Systolic Blood Pressure', indicator: 'Vital Signs' },
    { name: 'Diastolic Blood Pressure', indicator: 'Vital Signs' },
    { name: 'Body Temperature', indicator: 'Vital Signs' },
    { name: 'Respiratory Rate', indicator: 'Vital Signs' },
    { name: 'Oxygen Saturation', indicator: 'Vital Signs' },
    { name: 'Pulse Rate', indicator: 'Vital Signs' },
    { name: 'Body Weight', indicator: 'Anthropometry' },
    { name: 'Body Height', indicator: 'Anthropometry' },
    { name: 'BMI', indicator: 'Anthropometry' },
    { name: 'MUAC', indicator: 'Anthropometry' },
    { name: 'Head Circumference', indicator: 'Anthropometry' },
    { name: 'Haemoglobin Level', indicator: 'Lab Results' },
    { name: 'Blood Glucose', indicator: 'Lab Results' },
    { name: 'Malaria RDT Result', indicator: 'Lab Results' },
    { name: 'HIV Test Result', indicator: 'Lab Results' },
    { name: 'Urine Protein', indicator: 'Lab Results' },
    { name: 'Cough Duration', indicator: 'Symptoms' },
    { name: 'Fever Duration', indicator: 'Symptoms' },
    { name: 'Pain Score', indicator: 'Symptoms' },
    { name: 'Nausea Severity', indicator: 'Symptoms' },
    { name: 'Pregnancy Status', indicator: 'Reproductive Health' },
    { name: 'Gestational Age', indicator: 'Reproductive Health' },
    { name: 'Fundal Height', indicator: 'Reproductive Health' },
    { name: 'Gravidity', indicator: 'Reproductive Health' },
  ]);
  return {
    id: `${prefix}programDataElement_${id}`,
    type: chance.pickone(PROGRAM_DATA_ELEMENT_TYPE_VALUES),
    code: `PDE-${chance.hash({ length: 6 }).toUpperCase()}`,
    name: elementName,
    indicator,
    defaultText: chance.pickone([
      'Enter measured value',
      'Select from options below',
      'Record observation here',
      'Measured at time of visit',
      'Ask patient directly',
      'Refer to lab slip',
      'Use standard equipment',
    ]),
    defaultOptions: '',
  };
}

export function fakeReferenceData(prefix: string = 'test-') {
  const id = fakeUUID();
  const { type, name } = chance.pickone([
    { type: 'drug', name: chance.pickone(DRUG_NAMES) },
    { type: 'allergy', name: chance.pickone(ALLERGY_NAMES) },
    { type: 'diagnosis', name: chance.pickone(DIAGNOSIS_NAMES) },
    { type: 'triageReason', name: chance.pickone(TRIAGE_REASON_NAMES) },
    { type: 'village', name: chance.pickone(VILLAGE_NAMES) },
    { type: 'xRayImagingArea', name: chance.pickone(X_RAY_AREA_NAMES) },
    { type: 'ctScanImagingArea', name: chance.pickone(CT_SCAN_AREA_NAMES) },
    { type: 'ultrasoundImagingArea', name: chance.pickone(ULTRASOUND_AREA_NAMES) },
    { type: 'procedureType', name: chance.pickone(PROCEDURE_TYPE_NAMES) },
    {
      type: 'division',
      name: chance.pickone([
        'Northern Division',
        'Southern Division',
        'Eastern Division',
        'Western Division',
        'Central Division',
        'Highlands Division',
        'Islands Division',
        'Coastal Division',
      ]),
    },
    {
      type: 'subdivision',
      name: chance.pickone([
        'Kairuku District',
        'Rigo District',
        'Abau District',
        'Goilala District',
        'North Coast',
        'South Coast',
        'Upper Valley',
        'Lower Valley',
      ]),
    },
    {
      type: 'ethnicity',
      name: chance.pickone([
        'Melanesian',
        'Polynesian',
        'Micronesian',
        'Papuan',
        'Chinese',
        'European',
        'Mixed Heritage',
        'Indian',
        'Filipino',
      ]),
    },
    {
      type: 'nationality',
      name: chance.pickone([
        'Papua New Guinean',
        'Australian',
        'New Zealander',
        'Fijian',
        'Samoan',
        'Tongan',
        'Solomon Islander',
        'Vanuatuan',
      ]),
    },
    {
      type: 'occupation',
      name: chance.pickone([
        'Farmer',
        'Teacher',
        'Nurse',
        'Trader',
        'Fisherman',
        'Driver',
        'Carpenter',
        'Student',
        'Homemaker',
        'Public servant',
      ]),
    },
    {
      type: 'religion',
      name: chance.pickone([
        'Catholic',
        'Lutheran',
        'United Church',
        'Seventh Day Adventist',
        'Anglican',
        'Pentecostal',
        'Baptist',
        'Evangelical',
      ]),
    },
    {
      type: 'labTestCategory',
      name: chance.pickone([
        'Haematology',
        'Biochemistry',
        'Microbiology',
        'Serology',
        'Urinalysis',
        'Parasitology',
        'Immunology',
        'Cytology',
      ]),
    },
  ]);
  return {
    id: `${prefix}referenceData_${id}`,
    type,
    visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    name,
    code: `REF-${chance.hash({ length: 6 }).toUpperCase()}`,
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
  const programName = chance.pickone([
    'Malaria Control Program',
    'Maternal Health Program',
    'Tuberculosis Program',
    'HIV/AIDS Program',
    'Child Health Program',
    'Nutrition Program',
    'Non-Communicable Disease Program',
    'Expanded Programme on Immunization',
    'Reproductive Health Program',
    'Mental Health Program',
    'Neglected Tropical Diseases Program',
    'Water & Sanitation Program',
    'Community Health Worker Program',
    'Outbreak Surveillance Program',
  ]);
  return {
    id: `${prefix}program_${id}`,
    name: programName,
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
    reasonForEncounter: chance.pickone([
      'Routine check-up',
      'Fever and headache',
      'Follow-up visit',
      'Injury assessment',
      'Prenatal care',
      'Chest pain',
      'Abdominal pain',
      'Vaccination',
      'Persistent cough',
      'Skin rash',
      'Diarrhoea and vomiting',
      'Wound dressing',
      'Medication review',
      'Shortness of breath',
      'Joint pain',
      'Eye infection',
      'Ear pain',
      'Dental referral',
      'Post-surgical review',
      'Counselling session',
      'Growth monitoring',
      'Lab result follow-up',
    ]),
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
  const { name, body } = chance.pickone([
    {
      name: 'Blood pressure',
      body: `${chance.integer({ min: 90, max: 160 })}/${chance.integer({ min: 50, max: 100 })}`,
    },
    { name: 'Temperature', body: `${chance.floating({ min: 36.0, max: 39.5, fixed: 1 })}` },
    { name: 'Weight', body: `${chance.floating({ min: 40, max: 120, fixed: 1 })}` },
    { name: 'Height', body: `${chance.integer({ min: 140, max: 195 })}` },
    { name: 'Heart rate', body: `${chance.integer({ min: 50, max: 120 })}` },
    { name: 'SpO2', body: `${chance.integer({ min: 90, max: 100 })}%` },
    { name: 'Respiratory rate', body: `${chance.integer({ min: 12, max: 28 })}` },
    { name: 'Blood glucose', body: `${chance.floating({ min: 3.5, max: 15.0, fixed: 1 })}` },
    { name: 'MUAC', body: `${chance.floating({ min: 10.0, max: 30.0, fixed: 1 })}` },
    { name: 'Pain score', body: `${chance.integer({ min: 0, max: 10 })}` },
    { name: 'Haemoglobin', body: `${chance.floating({ min: 7.0, max: 17.0, fixed: 1 })}` },
    { name: 'Gestational age (weeks)', body: `${chance.integer({ min: 4, max: 42 })}` },
    { name: 'Fundal height', body: `${chance.integer({ min: 12, max: 40 })}` },
    { name: 'Malaria RDT', body: chance.pickone(['Positive', 'Negative']) },
    {
      name: 'HIV test result',
      body: chance.pickone(['Reactive', 'Non-reactive', 'Indeterminate']),
    },
    { name: 'Oedema', body: chance.pickone(['None', 'Mild (+)', 'Moderate (++)', 'Severe (+++)']) },
    {
      name: 'Notes',
      body: chance.pickone([
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
  ]);
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
    note: chance.pickone([
      'Take with food',
      'Avoid alcohol during course',
      'Review in 2 weeks',
      'Monitor for side effects',
      'Reduce dose if drowsy',
      'Continue until course complete',
      'Take on an empty stomach',
      'Do not crush or chew',
      'Store in refrigerator',
      'Apply to affected area only',
      'Shake well before use',
      'Complete full course even if symptoms improve',
      'Take at bedtime',
      'Avoid direct sunlight while using',
    ]),
    indication: chance.pickone([
      'Bacterial infection',
      'Pain management',
      'Hypertension',
      'Type 2 diabetes',
      'Inflammation',
      'Acid reflux',
      'Malaria treatment',
      'Asthma',
      'Anxiety',
      'Anaemia',
      'Fungal infection',
      'Fever',
      'Allergic reaction',
      'Wound prophylaxis',
      'Tuberculosis',
      'HIV antiretroviral therapy',
    ]),
    route: chance.pickone([
      'Oral',
      'Intravenous',
      'Intramuscular',
      'Topical',
      'Subcutaneous',
      'Rectal',
      'Sublingual',
      'Inhaled',
      'Ophthalmic',
      'Otic',
    ]),
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
  Facility: () => {
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
      name: `${namePrefix} ${nameSuffix}`,
      email: chance.email(),
      contactNumber: chance.phone(),
      streetAddress: `${chance.natural({ max: 999 })} ${chance.street()}`,
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
    const { code: baseCode, name: baseName, unit } = chance.pickone([
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
      reasonForCancellation: isCancelled ? chance.pickone(['duplicate', 'entered-in-error']) : null,
    };
  },
  Patient: () => {
    const sex = chance.pickone(['male', 'female', 'other']);
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
      dateOfBirth: toDateString(
        chance.date({ year: chance.integer({ min: 1940, max: CURRENT_YEAR - 1 }) }) as Date,
      ),
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
      bloodType: chance.pickone(['O', 'A', 'B', 'AB']) + chance.pickone(['+', '-']),
      primaryContactNumber: chance.phone(),
      secondaryContactNumber: chance.phone(),
      maritalStatus: chance.pickone([
        'Single',
        'Married',
        'Widowed',
        'Divorced',
        'Separated',
        'De Facto',
      ]),
      cityTown: chance.city(),
      streetVillage: chance.street(),
      educationalLevel: chance.pickone([
        'None',
        'Primary',
        'High School',
        'Bachelors',
        'Masters',
        'PhD',
      ]),
      socialMedia: `@${chance.first().toLowerCase()}${chance.last().toLowerCase()}${chance.integer({ min: 1, max: 99 })}`,
      title: chance.prefix(),
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
    };
  },
  PatientProgramRegistration: ({ patientId, programRegistryId }) => ({
    id: `${patientId.replaceAll(';', ':')};${programRegistryId.replaceAll(';', ':')}`,
    registrationStatus: REGISTRATION_STATUSES.ACTIVE,
  }),
  Prescription: () => ({
    frequency: chance.pickone(Object.values(ADMINISTRATION_FREQUENCIES)),
    discontinued: false,
    endDate: null,
    idealTimes: null,
  }),
  User: () => ({
    email: chance.email({ length: 20 }),
    displayId: chance.hash({ length: 5 }),
    displayName: chance.name(),
    role: 'practitioner',
  }),
  ReferenceData: () => ({
    type: chance.pickone(REFERENCE_TYPE_VALUES),
    availableFacilities: null,
  }),
  Role: () => ({
    name: `${snakeCase(chance.profession())}_${chance.hash({ length: 8 })}`,
  }),
  Survey: () => ({
    isSensitive: false,
    notifyEmailAddresses: [],
  }),
  SurveyScreenComponent: () => ({
    calculation: null,
    visibilityCriteria: null,
    config: null,
    options: null,
  }),
  Encounter: () => ({
    encounterType: chance.pickone(ENCOUNTER_TYPE_VALUES),
  }),
  Note: () => ({
    // This is a hack because the type of Note.id is UUID, whereas tests might create ids of the form:
    // Note.id.123e4567-e89b-12d3-a456-426614174000
    // Setting id: undefined allows the model to create a default uuid and therefore avoid erroring
    // It will be fixed properly as part of EPI-160
    id: undefined,
    noteTypeId: chance.pickone(NOTE_TYPE_VALUES),
    revisedById: undefined,
  }),
  Location: () => ({
    maxOccupancy: chance.pickone([1, null]),
  }),
  ProgramRegistry: () => ({
    currentlyAtType: chance.pickone(Object.values(CURRENTLY_AT_TYPES)),
  }),
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
    recordUpdate: true,
  }),
};

const FHIR_MODELS_HANDLERS = {
  FhirPatient: {
    identifier: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirIdentifier.fake(...args)),
    name: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirHumanName.fake(...args)),
    telecom: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirContactPoint.fake(...args)),
    address: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirAddress.fake(...args)),
    link: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirPatientLink.fake(...args)),
    extension: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirExtension.fake(...args)),
  },
  FhirServiceRequest: {
    identifier: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirIdentifier.fake(...args)),
    category: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirCodeableConcept.fake(...args)),
    order_detail: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirCodeableConcept.fake(...args)),
    location_code: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirCodeableConcept.fake(...args)),
    code: (...args: any[]) => FhirCodeableConcept.fake(...args),
    subject: (...args: any[]) => FhirReference.fake(...args),
    requester: (...args: any[]) => FhirReference.fake(...args),
  },
  FhirDiagnosticReport: {
    extension: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirExtension.fake(...args)),
    identifier: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirIdentifier.fake(...args)),
    code: (...args: any[]) => FhirCodeableConcept.fake(...args),
    subject: (...args: any[]) => FhirReference.fake(...args),
    performer: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirReference.fake(...args)),
    result: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirReference.fake(...args)),
  },
  FhirImmunization: {
    vaccine_code: (...args: any[]) => FhirCodeableConcept.fake(...args),
    patient: (...args: any[]) => FhirReference.fake(...args),
    encounter: (...args: any[]) => FhirReference.fake(...args),
    site: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirCodeableConcept.fake(...args)),
    performer: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirImmunizationPerformer.fake(...args)),
    protocol_applied: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirImmunizationProtocolApplied.fake(...args)),
  },
  FhirImagingStudy: {
    identifier: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirIdentifier.fake(...args)),
    basedOn: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirReference.fake(...args)),
    note: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirAnnotation.fake(...args)),
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

    if (type instanceof DataTypes.ARRAY && (type as any).type) {
      return Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => fakeField(name, { ...attribute, type: (type as any).type }));
    }

    if (defaultValue) {
      if (defaultValue instanceof Sequelize.NOW || defaultValue instanceof Sequelize.UUIDV4) {
        return undefined;
      }
      return isFunction(defaultValue) ? defaultValue() : defaultValue;
    }

    if (type instanceof DataTypes.BLOB) {
      return Buffer.from('test');
    }

    if (FIELD_HANDLERS[type]) {
      return FIELD_HANDLERS[type](model, attribute, id);
    }

    if (type.type && FIELD_HANDLERS[type.type]) {
      return FIELD_HANDLERS[type.type](model, attribute, id);
    }

    if (type instanceof DataTypes.STRING && (type as any).options.length) {
      return FIELD_HANDLERS['VARCHAR(N)'](model, attribute, id, (type as any).options.length);
    }

    if (type instanceof DataTypes.JSONB && FHIR_MODELS_HANDLERS[model.name]?.[fieldName]) {
      return FHIR_MODELS_HANDLERS[model.name][fieldName](model, attribute, id);
    }

    if (type instanceof DataTypes.JSONB) {
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
