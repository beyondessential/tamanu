// for explanation of types, see
// https://docs.google.com/spreadsheets/d/1qwfw1AOED7WiElOCJwt_VHo_JaDhr6ZIiJMqjRCXajQ/edit#gid=1797422705

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
  PATIENT_DATA: 'PatientData',
  USER_DATA: 'UserData',
  PATIENT_ISSUE: 'PatientIssue',
};
export const PROGRAM_DATA_ELEMENT_TYPE_VALUES = Object.values(
  PROGRAM_DATA_ELEMENT_TYPES,
);

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
};

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

export const PATIENT_DATA_FIELD_LOCATIONS = {
  PatientProgramRegistration: {
    registrationClinicalStatus: 'clinicalStatusId',
    programRegistrationStatus: 'registrationStatus',
    registrationClinician: 'clinicianId',
    registeringFacility: 'registeringFacilityId',
    registrationCurrentlyAtVillage: 'villageId',
    registrationCurrentlyAtFacility: 'facilityId',
  },
};
