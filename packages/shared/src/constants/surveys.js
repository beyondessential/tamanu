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
export const PROGRAM_DATA_ELEMENT_TYPE_VALUES = Object.values(PROGRAM_DATA_ELEMENT_TYPES);

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

export const VITALS_DATA_ELEMENT_IDS = {
  dateRecorded: 'pde-PatientVitalsDate',
  temperature: 'pde-PatientVitalsTemperature',
  weight: 'pde-PatientVitalsWeight',
  height: 'pde-PatientVitalsHeight',
  sbp: 'pde-PatientVitalsSBP',
  dbp: 'pde-PatientVitalsDBP',
  heartRate: 'pde-PatientVitalsHeartRate',
  respiratoryRate: 'pde-PatientVitalsRespiratoryRate',
  spo2: 'pde-PatientVitalsSPO2',
  avpu: 'pde-PatientVitalsAVPU',
};
