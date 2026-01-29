// for explanation of types, see
// https://docs.google.com/spreadsheets/d/1qwfw1AOED7WiElOCJwt_VHo_JaDhr6ZIiJMqjRCXajQ/edit#gid=1797422705

import {
  BLOOD_LABELS,
  EDUCATIONAL_ATTAINMENT_LABELS,
  MARTIAL_STATUS_LABELS,
  SEX_LABELS,
  SOCIAL_MEDIA_LABELS,
  TITLE_LABELS,
} from './patientFields';
import { PROGRAM_REGISTRATION_STATUS_LABELS } from './programRegistry';

export const PROGRAM_DATA_ELEMENT_TYPES = {
  TEXT: 'FreeText',
  MULTILINE: 'Multiline',
  RADIO: 'Radio',
  SELECT: 'Select',
  MULTI_SELECT: 'MultiSelect',
  AUTOCOMPLETE: 'Autocomplete',
  DATE: 'Date',
  DATE_TIME: 'DateTime',
  SUBMISSION_DATE: 'SubmissionDate',
  INSTRUCTION: 'Instruction',
  NUMBER: 'Number',
  BINARY: 'Binary',
  CHECKBOX: 'Checkbox',
  CALCULATED: 'CalculatedQuestion',
  CONDITION: 'ConditionQuestion',
  RESULT: 'Result',
  SURVEY_ANSWER: 'SurveyAnswer',
  SURVEY_RESULT: 'SurveyResult',
  SURVEY_LINK: 'SurveyLink',
  PHOTO: 'Photo',
  SIGNATURE: 'Signature',
  PATIENT_DATA: 'PatientData',
  USER_DATA: 'UserData',
  PATIENT_ISSUE: 'PatientIssue',
  GEOLOCATE: 'Geolocate',
  COMPLEX_CHART_INSTANCE_NAME: 'ComplexChartInstanceName',
  COMPLEX_CHART_DATE: 'ComplexChartDate',
  COMPLEX_CHART_TYPE: 'ComplexChartType',
  COMPLEX_CHART_SUBTYPE: 'ComplexChartSubtype',
};

export const PROGRAM_DATA_ELEMENT_TYPE_VALUES = Object.values(PROGRAM_DATA_ELEMENT_TYPES);

export const COMPLEX_CORE_DATA_ELEMENT_TYPES = [
  PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_INSTANCE_NAME,
  PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_DATE,
  PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_TYPE,
  PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_SUBTYPE,
];

export const NON_ANSWERABLE_DATA_ELEMENT_TYPES = [
  PROGRAM_DATA_ELEMENT_TYPES.INSTRUCTION,
  PROGRAM_DATA_ELEMENT_TYPES.RESULT,
];

export const ACTION_DATA_ELEMENT_TYPES = [
  PROGRAM_DATA_ELEMENT_TYPES.PATIENT_ISSUE,
  PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA,
];

export const SURVEY_TYPES = {
  PROGRAMS: 'programs',
  REFERRAL: 'referral',
  OBSOLETE: 'obsolete',
  VITALS: 'vitals',
  SIMPLE_CHART: 'simpleChart',
  COMPLEX_CHART: 'complexChart',
  COMPLEX_CHART_CORE: 'complexChartCore',
};

export const CHARTING_SURVEY_TYPES = [
  SURVEY_TYPES.SIMPLE_CHART,
  SURVEY_TYPES.COMPLEX_CHART,
  SURVEY_TYPES.COMPLEX_CHART_CORE,
];

const PDE_DATE_RECORDED = 'pde-PatientVitalsDate';
const PDE_TEMPERATURE = 'pde-PatientVitalsTemperature';
const PDE_WEIGHT = 'pde-PatientVitalsWeight';
const PDE_HEIGHT = 'pde-PatientVitalsHeight';
const PDE_SBP = 'pde-PatientVitalsSBP';
const PDE_DBP = 'pde-PatientVitalsDBP';
const PDE_HEART_RATE = 'pde-PatientVitalsHeartRate';
const PDE_RESPIRATORY_RATE = 'pde-PatientVitalsRespiratoryRate';
const PDE_SPO2 = 'pde-PatientVitalsSPO2';
const PDE_AVPU = 'pde-PatientVitalsAVPU';

export const VITALS_DATA_ELEMENT_IDS = {
  dateRecorded: PDE_DATE_RECORDED,
  temperature: PDE_TEMPERATURE,
  weight: PDE_WEIGHT,
  height: PDE_HEIGHT,
  sbp: PDE_SBP,
  dbp: PDE_DBP,
  heartRate: PDE_HEART_RATE,
  respiratoryRate: PDE_RESPIRATORY_RATE,
  spo2: PDE_SPO2,
  avpu: PDE_AVPU,
};

export const CHARTING_DATA_ELEMENT_IDS = {
  dateRecorded: 'pde-PatientChartingDate',
  complexChartInstanceName: 'pde-ComplexChartInstanceName',
  complexChartDate: 'pde-ComplexChartDate',
  complexChartType: 'pde-ComplexChartType',
  complexChartSubtype: 'pde-ComplexChartSubtype',
};

export const CHARTING_CORE_TYPE_TO_ID = {
  [PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_INSTANCE_NAME]:
    CHARTING_DATA_ELEMENT_IDS.complexChartInstanceName,
  [PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_DATE]: CHARTING_DATA_ELEMENT_IDS.complexChartDate,
  [PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_TYPE]: CHARTING_DATA_ELEMENT_IDS.complexChartType,
  [PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_SUBTYPE]: CHARTING_DATA_ELEMENT_IDS.complexChartSubtype,
};

export const BLOOD_PRESSURE = 'BLOOD_PRESSURE';
export const LINE = 'LINE';
export const VITAL_CHARTS = {
  [PDE_TEMPERATURE]: LINE,
  [PDE_WEIGHT]: LINE,
  [PDE_HEIGHT]: LINE,
  [PDE_SBP]: BLOOD_PRESSURE,
  [PDE_DBP]: BLOOD_PRESSURE,
  [PDE_HEART_RATE]: LINE,
  [PDE_RESPIRATORY_RATE]: LINE,
  [PDE_SPO2]: LINE,
  [PDE_AVPU]: LINE,
};

// utility function for when a model's fields are all a direct match for their survey configs
const makeLookupFields = (model: string, fields: (string | [string, Record<string, string>])[]) =>
  Object.fromEntries(
    fields.map(f => [Array.isArray(f) ? f[0] : f, [model, ...(Array.isArray(f) ? f : [f])]]),
  );

// Following this format:
// [modelName, fieldName, options]
// options is an object with the key being the value and the value being the label
// if options is not provided, the field is a standard field without options (e.g. 'fullName')
// if options is provided, the field is a standard field with options (e.g. ['sex', SEX_LABELS])
type PatientDataFieldLocationsType = {
  [key: string]: [string, string, Record<string, string>] | [string, string];
};

// Please keep in sync with:
// - mobile/App/constants/surveys
export const PATIENT_DATA_FIELD_LOCATIONS: PatientDataFieldLocationsType = {
  registrationClinicalStatus: ['PatientProgramRegistration', 'clinicalStatusId'],
  programRegistrationStatus: [
    'PatientProgramRegistration',
    'registrationStatus',
    PROGRAM_REGISTRATION_STATUS_LABELS,
  ],
  registrationClinician: ['PatientProgramRegistration', 'clinicianId'],
  registeringFacility: ['PatientProgramRegistration', 'registeringFacilityId'],
  registrationCurrentlyAtVillage: ['PatientProgramRegistration', 'villageId'],
  registrationCurrentlyAtFacility: ['PatientProgramRegistration', 'facilityId'],
  ...makeLookupFields('Patient', [
    'firstName',
    'middleName',
    'lastName',
    'culturalName',
    'dateOfBirth',
    'dateOfDeath',
    ['sex', SEX_LABELS],
    'email',
    'villageId',
  ]),
  ...makeLookupFields('PatientAdditionalData', [
    'placeOfBirth',
    ['bloodType', BLOOD_LABELS],
    'primaryContactNumber',
    'secondaryContactNumber',
    ['maritalStatus', MARTIAL_STATUS_LABELS],
    'cityTown',
    'streetVillage',
    ['educationalLevel', EDUCATIONAL_ATTAINMENT_LABELS],
    ['socialMedia', SOCIAL_MEDIA_LABELS],
    ['title', TITLE_LABELS],
    'birthCertificate',
    'drivingLicense',
    'passport',
    'emergencyContactName',
    'emergencyContactNumber',

    'registeredById',
    'motherId',
    'fatherId',
    'nationalityId',
    'countryId',
    'divisionId',
    'subdivisionId',
    'medicalAreaId',
    'nursingZoneId',
    'settlementId',
    'ethnicityId',
    'occupationId',
    'religionId',
    'patientBillingTypeId',
    'countryOfBirthId',
  ]),
};

// The 'location' for the following fields is defined on the frontend
// Please keep in sync with:
// - mobile/App/constants/surveys
export const READONLY_DATA_FIELDS = {
  AGE: 'age',
  AGE_WITH_MONTHS: 'ageWithMonths',
  FULL_NAME: 'fullName',
};

export const PROGRAM_REGISTRY_FIELD_LOCATIONS = Object.keys(PATIENT_DATA_FIELD_LOCATIONS).filter(
  key => PATIENT_DATA_FIELD_LOCATIONS[key]![0] === 'PatientProgramRegistration',
);

export const RESULT_COLORS = {
  green: '#83d452',
  yellow: '#ffea5a',
  orange: '#fe8c00',
  red: '#ff2222',
  deepred: '#971a1a',
  purple: '#971a1a',
};

export const PORTAL_SURVEY_ASSIGNMENTS_STATUSES = {
  OUTSTANDING: 'outstanding',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};
