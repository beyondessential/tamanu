import { randomInt } from 'crypto';
import { isFunction, kebabCase, snakeCase, startCase } from 'es-toolkit/compat';
import Chance from 'chance';
import Sequelize from 'sequelize';
import { inspect } from 'util';
import { formatISO9075 } from 'date-fns';
import {
  ADMINISTRATION_FREQUENCIES,
  ATTENDANT_OF_BIRTH_TYPES,
  DRUG_UNITS,
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
import { REFERENCE_DATA_NAMES } from './referenceDataNames.js';

// This file is most commonly used within tests, but also outside them. Under the test suite
// TAMANU_TEST_SEED is set for the whole run and printed at startup (see scripts/testSeed.mjs),
// so a data-dependent failure can be reproduced by re-running with the same seed; elsewhere
// there is no seed to honour. A seed of `0` is valid, hence testing the string not the number.
const seedFromEnvironment = process.env.TAMANU_TEST_SEED?.trim();
export const chance = new Chance(
  seedFromEnvironment ? Number(seedFromEnvironment) : randomInt(2 ** 42),
);

const shuffledPools = new Map<string, string[]>();

// Cycles a pool in shuffled order, so a seeded database shows a spread of names
// instead of the same handful repeated.
const pickDistinct = (poolName: string, pool: string[]): string => {
  let remaining = shuffledPools.get(poolName);
  if (!remaining?.length) {
    remaining = chance.shuffle([...pool]);
    shuffledPools.set(poolName, remaining);
  }
  return remaining.pop() ?? pool[0];
};

// Several of these models hold a unique index on code, so names alone can't fill it.
const codeFor = (name: string) => `${kebabCase(name).slice(0, 40)}-${chance.hash({ length: 8 })}`;

const referenceDataName = (type: string) => {
  const pool = REFERENCE_DATA_NAMES[type];
  if (!pool) return `${startCase(type)} ${chance.integer({ min: 1, max: 99 })}`;
  return pickDistinct(`referenceData:${type}`, pool);
};

const VACCINES = [
  { label: 'BCG', brand: 'BCG-SSI', disease: 'Tuberculosis' },
  { label: 'Hepatitis B', brand: 'Euvax B', disease: 'Hepatitis B' },
  { label: 'OPV', brand: 'bOPV', disease: 'Poliomyelitis' },
  { label: 'IPV', brand: 'Imovax Polio', disease: 'Poliomyelitis' },
  { label: 'DTP', brand: 'Infanrix hexa', disease: 'Diphtheria, tetanus and pertussis' },
  { label: 'Measles', brand: 'Rouvax', disease: 'Measles' },
  { label: 'MMR', brand: 'Priorix', disease: 'Measles, mumps and rubella' },
  { label: 'Tetanus', brand: 'Tetavax', disease: 'Tetanus' },
  { label: 'Pneumococcal', brand: 'Prevenar 13', disease: 'Pneumococcal disease' },
  { label: 'Rotavirus', brand: 'Rotarix', disease: 'Rotavirus gastroenteritis' },
  { label: 'HPV', brand: 'Gardasil 9', disease: 'Human papillomavirus' },
  { label: 'Yellow Fever', brand: 'Stamaril', disease: 'Yellow fever' },
  { label: 'Typhoid', brand: 'Typhim Vi', disease: 'Typhoid fever' },
  { label: 'Influenza', brand: 'Fluarix Tetra', disease: 'Influenza' },
  { label: 'Varicella', brand: 'Varivax', disease: 'Chickenpox' },
  { label: 'Hepatitis A', brand: 'Havrix', disease: 'Hepatitis A' },
  { label: 'Meningococcal', brand: 'Nimenrix', disease: 'Meningococcal disease' },
  { label: 'Japanese Encephalitis', brand: 'Imojev', disease: 'Japanese encephalitis' },
  { label: 'COVID-19', brand: 'Comirnaty', disease: 'COVID-19' },
];

const SCHEDULED_VACCINE_LABELS = VACCINES.map(({ label }) => label);

const SCHEDULED_VACCINE_DOSE_LABELS = [
  'Dose 1',
  'Dose 2',
  'Dose 3',
  'Dose 4',
  'Booster',
  'Birth dose',
  'Annual',
];

const SURVEY_NAMES = [
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
];

const SURVEY_SCREEN_COMPONENT_PROMPTS = [
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
];

const PROGRAM_DATA_ELEMENTS = [
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
];

const PROGRAM_DATA_ELEMENT_HINTS = [
  'Enter measured value',
  'Select from options below',
  'Record observation here',
  'Measured at time of visit',
  'Ask patient directly',
  'Refer to lab slip',
  'Use standard equipment',
];

const PROGRAM_NAMES = [
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
];

const PROGRAM_REGISTRY_NAMES = [
  'Tuberculosis Registry',
  'HIV Care Registry',
  'Diabetes Registry',
  'Hypertension Registry',
  'Antenatal Registry',
  'Child Nutrition Registry',
  'Leprosy Registry',
  'Cervical Cancer Screening Registry',
  'Mental Health Registry',
  'Rheumatic Heart Disease Registry',
  'Chronic Kidney Disease Registry',
  'Immunisation Defaulter Registry',
];

const PROGRAM_REGISTRY_CONDITION_NAMES = [
  'Pulmonary TB',
  'Extrapulmonary TB',
  'Type 1 Diabetes',
  'Type 2 Diabetes',
  'Gestational Diabetes',
  'Stage 1 Hypertension',
  'Stage 2 Hypertension',
  'Asthma',
  'Chronic Kidney Disease',
  'Rheumatic Heart Disease',
  'Severe Acute Malnutrition',
  'Depression',
];

const PROGRAM_REGISTRY_CLINICAL_STATUS_NAMES = [
  'Newly diagnosed',
  'On treatment',
  'Treatment complete',
  'Lost to follow-up',
  'Transferred out',
  'In remission',
  'Relapsed',
  'Under review',
];

const DEPARTMENT_NAMES = [
  'Emergency',
  'General Medicine',
  'Surgical',
  'Paediatrics',
  'Obstetrics & Gynaecology',
  'Outpatients',
  'Renal',
  'Oncology',
  'Radiology',
  'Laboratory',
  'Pharmacy',
  'Physiotherapy',
  'Mental Health',
  'Intensive Care',
];

const LOCATION_GROUP_NAMES = [
  'Ward A',
  'Ward B',
  'Emergency Department',
  'Maternity Ward',
  'Paediatric Ward',
  'Surgical Ward',
  'Intensive Care Unit',
  'Outpatient Clinic',
  'Day Procedure Unit',
  'Isolation Unit',
];

const LOCATION_NAMES = [
  'Bed 1',
  'Bed 2',
  'Bed 3',
  'Bed 4',
  'Bed 5',
  'Bed 6',
  'Resuscitation Bay',
  'Treatment Room 1',
  'Treatment Room 2',
  'Consult Room 1',
  'Consult Room 2',
  'Triage Bay',
  'Recovery Bay',
  'Isolation Room',
];

const REPORT_TOPICS = [
  'Encounter Summary',
  'Patient Registrations',
  'Vaccination Coverage',
  'Lab Turnaround Times',
  'Outstanding Imaging Requests',
  'Antenatal Visit Compliance',
  'Medication Dispensing Summary',
  'Admissions by Diagnosis',
  'Deaths by Cause',
  'Task Completion Rates',
  'Bed Occupancy',
  'Referral Outcomes',
  'Program Registry Activity',
  'Outpatient Attendance',
];

const REPORT_PERIODS = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual'];

const REPORT_DEFINITION_NAMES = REPORT_TOPICS.flatMap(topic =>
  REPORT_PERIODS.flatMap(period =>
    [2021, 2022, 2023, 2024, 2025, 2026].map(year => `${topic} - ${period} ${year}`),
  ),
);

const INVOICE_PRODUCT_NAMES = [
  'Standard consultation',
  'Specialist consultation',
  'Ward bed day',
  'Theatre fee',
  'Chest X-Ray',
  'Ultrasound scan',
  'Full blood count',
  'Malaria rapid test',
  'Dressing pack',
  'Ambulance transfer',
  'Dispensing fee',
  'Physiotherapy session',
];

const NOTE_CONTENTS = [
  'Reviewed on ward round, observations stable.',
  'Complains of ongoing pain, analgesia given.',
  'Wound reviewed, healing well, dressing changed.',
  'Family updated on plan of care.',
  'Awaiting lab results before next review.',
  'Tolerating oral intake, IV fluids stopped.',
  'Mobilising independently, physiotherapy to continue.',
  'Afebrile overnight, antibiotics continued.',
  'Discussed discharge planning with patient.',
  'Referred to outpatient clinic for follow-up.',
  'Medication chart reviewed, no changes required.',
  'Patient declined further investigation today.',
  'Vitals within normal range, no acute concerns.',
  'Handover given to incoming shift.',
];

const PROCEDURE_NOTES = [
  'Local anaesthetic used',
  'Consent obtained prior to procedure',
  'Sterile technique maintained throughout',
  'Patient positioned supine',
  'Antibiotic prophylaxis given',
];

const PROCEDURE_COMPLETED_NOTES = [
  'Completed without complication',
  'Patient tolerated procedure well',
  'Minor bleeding controlled',
  'Wound closed and dressed',
  'Transferred to recovery in stable condition',
];

const ENCOUNTER_REASONS = [
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
];

const PRESCRIPTION_NOTES = [
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
];

const PRESCRIPTION_INDICATIONS = [
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
];

const ALLERGY_NOTES = [
  'Reported by patient',
  'Confirmed on previous admission',
  'Family reports childhood reaction',
  'Avoid all related agents',
  'Reaction documented in paper notes',
];

const CONDITION_NOTES = [
  'Diagnosed at district hospital',
  'Managed in the community',
  'Reviewed annually',
  'Well controlled on current treatment',
  'Under specialist follow-up',
];

const TASK_NOTES = [
  'Patient asleep, will return',
  'Deferred to next round',
  'Equipment collected from store',
  'Second nurse assisted',
  'Patient off ward for imaging',
  'Completed at bedside',
];

const QUALITATIVE_LAB_RESULTS = [
  'Positive',
  'Negative',
  'Not detected',
  'Reactive',
  'Non-reactive',
  'Inconclusive',
  'No growth',
];

const LAB_RESULT_INTERPRETATIONS = [
  'Within normal limits',
  'Slightly elevated, repeat in 2 weeks',
  'Consistent with iron deficiency',
  'Suggests bacterial infection',
  'Below reference range, correlate clinically',
  'Haemolysed sample, recollection advised',
  'No significant abnormality detected',
];

const IMAGING_RESULT_DESCRIPTIONS = [
  'No acute abnormality detected.',
  'Mild consolidation in the right lower lobe.',
  'No fracture or dislocation seen.',
  'Small pleural effusion on the left.',
  'Cardiomegaly with clear lung fields.',
  'Normal study for age.',
  'Degenerative changes in the lumbar spine.',
  'Single live intrauterine pregnancy.',
];

const INVOICE_NOTES = [
  'Discussed with patient at reception',
  'Awaiting insurer confirmation',
  'Partial payment received',
  'Approved by finance officer',
  'Item added after discharge',
];

const INVOICE_DISCOUNT_REASONS = [
  'Financial hardship',
  'Staff discount',
  'Community health card',
  'Insurer agreement',
  'Goodwill adjustment',
];

const DEATH_CAUSE_NOTES = [
  'Fall from height at home',
  'Road traffic incident',
  'Drowning at the reef',
  'Burns from a cooking fire',
  'Struck by falling debris',
];

const REGISTRATION_CHANGE_REASONS = [
  'Condition confirmed on review',
  'Resolved after treatment',
  'Recorded in error',
  'Updated after specialist advice',
  'Reclassified following lab results',
];

const PAUSE_NOTES = [
  'Paused for procedure',
  'Nil by mouth',
  'Awaiting review by prescriber',
  'Patient off ward',
  'Adverse reaction under investigation',
];

const DISCHARGE_NOTES = [
  'Discharged home with follow-up in 2 weeks',
  'Medications dispensed and explained',
  'Referred to community health worker',
  'Self-discharged against medical advice',
  'Transferred to provincial hospital',
];

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
  const type = chance.pickone(Object.keys(REFERENCE_DATA_NAMES));
  return {
    id: `${prefix}referenceData_${id}`,
    type,
    visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    name: chance.pickone(REFERENCE_DATA_NAMES[type]),
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
    const name = `${namePrefix} ${nameSuffix}`;
    return {
      name,
      code: codeFor(name),
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
      pregnancyMoment: chance.pickone(Object.values(PREGNANCY_MOMENTS)),
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
    dosingUnit: chance.pickone(Object.keys(DRUG_UNITS)),
    dispensingUnit: chance.pickone(Object.keys(DRUG_UNITS)),
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
  ReferenceData: ({ type }) => {
    const resolvedType = type ?? chance.pickone(REFERENCE_TYPE_VALUES);
    const name = referenceDataName(resolvedType);
    return {
      type: resolvedType,
      name,
      code: codeFor(name),
      availableFacilities: null,
    };
  },
  Department: () => {
    const name = pickDistinct('department', DEPARTMENT_NAMES);
    return { name, code: codeFor(name) };
  },
  LocationGroup: () => {
    const name = pickDistinct('locationGroup', LOCATION_GROUP_NAMES);
    return { name, code: codeFor(name) };
  },
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
    const productName = pickDistinct('invoiceProduct', INVOICE_PRODUCT_NAMES);
    return {
      note: chance.pickone(INVOICE_NOTES),
      productNameFinal: productName,
      productCodeFinal: codeFor(productName),
      sourceRecordType: null,
      sourceRecordId: null,
    };
  },
  InvoiceItemDiscount: () => ({
    reason: chance.pickone(INVOICE_DISCOUNT_REASONS),
  }),
  InvoiceProduct: () => ({
    name: pickDistinct('invoiceProduct', INVOICE_PRODUCT_NAMES),
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
  Program: () => {
    const name = pickDistinct('program', PROGRAM_NAMES);
    return { name, code: codeFor(name) };
  },
  ProgramDataElement: () => {
    const { name, indicator } = chance.pickone(PROGRAM_DATA_ELEMENTS);
    return {
      name,
      indicator,
      code: codeFor(name),
      defaultText: chance.pickone(PROGRAM_DATA_ELEMENT_HINTS),
      defaultOptions: null,
      visualisationConfig: null,
    };
  },
  ProgramRegistryCondition: () => {
    const name = pickDistinct('programRegistryCondition', PROGRAM_REGISTRY_CONDITION_NAMES);
    return { name, code: codeFor(name) };
  },
  ProgramRegistryClinicalStatus: () => {
    const name = pickDistinct(
      'programRegistryClinicalStatus',
      PROGRAM_REGISTRY_CLINICAL_STATUS_NAMES,
    );
    return { name, code: codeFor(name), color: chance.pickone(Object.keys(STATUS_COLOR)) };
  },
  ReportDefinition: () => ({
    name: pickDistinct('reportDefinition', REPORT_DEFINITION_NAMES),
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
    name: pickDistinct('task', REFERENCE_DATA_NAMES[REFERENCE_TYPES.TASK_TEMPLATE]),
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
    label: pickDistinct('scheduledVaccine', SCHEDULED_VACCINE_LABELS),
    doseLabel: chance.pickone(SCHEDULED_VACCINE_DOSE_LABELS),
    category: chance.pickone(VACCINE_CATEGORIES_VALUES),
  }),
  Survey: () => {
    const name = pickDistinct('survey', SURVEY_NAMES);
    return {
      name,
      code: codeFor(name),
      isSensitive: false,
      visibilityCriteria: null,
      notifyEmailAddresses: [],
    };
  },
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
  Location: () => {
    const name = pickDistinct('location', LOCATION_NAMES);
    return {
      name,
      code: codeFor(name),
      maxOccupancy: chance.pickone([1, null]),
    };
  },
  ProgramRegistry: () => {
    const name = pickDistinct('programRegistry', PROGRAM_REGISTRY_NAMES);
    return {
      name,
      code: codeFor(name),
      currentlyAtType: chance.pickone(Object.values(CURRENTLY_AT_TYPES)),
    };
  },
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
          ? chance.pickone(REFERENCE_DATA_NAMES[REFERENCE_TYPES.VACCINE_NOT_GIVEN_REASON])
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
