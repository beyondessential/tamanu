export const HTTP_METHOD_TO_ACTION = {
  GET: 'read',
  POST: 'create',
  PUT: 'update',
  PATCH: 'update',
  DELETE: 'delete',
};

export const SYNC_ACTIONS = {
  SAVE: 'save',
  REMOVE: 'remove',
  WIPE: 'wipe',
};

export const SYNC_MODES = {
  ON: true,
  OFF: false,
  REMOTE_TO_LOCAL: 'remote_to_local',
  LOCAL_TO_REMOTE: 'local_to_remote',
};

export const DISPLAY_ID_PLACEHOLDER = '-TMP-';

export const ENVIRONMENT_TYPE = {
  SERVER: 'server',
  LAN: 'lan',
  DESKTOP: 'desktop',
};

export const LAB_REQUEST_STATUSES = {
  RECEPTION_PENDING: 'reception_pending',
  RESULTS_PENDING: 'results_pending',
  TO_BE_VERIFIED: 'to_be_verified',
  VERIFIED: 'verified',
  PUBLISHED: 'published',
};

export const LAB_TEST_STATUSES = LAB_REQUEST_STATUSES;

export const NOTE_TYPES = {
  SYSTEM: 'system',
  OTHER: 'other',
  TREATMENT_PLAN: 'treatmentPlan',
};

export const PATIENT_ISSUE_TYPES = {
  ISSUE: 'issue',
  WARNING: 'warning',
};

export const ENCOUNTER_TYPES = {
  ADMISSION: 'admission',
  CLINIC: 'clinic',
  IMAGING: 'imaging',
  EMERGENCY: 'emergency',
  OBSERVATION: 'observation',
  TRIAGE: 'triage',
  SURVEY_RESPONSE: 'surveyResponse',
};

export const ENCOUNTER_TYPE_VALUES = Object.values(ENCOUNTER_TYPES);

export const ENCOUNTER_STATUSES = {
  ADMITTED: 'Admitted',
  DISCHARGED: 'Discharged',
  CHECKED_IN: 'CheckedIn',
  CHECKED_OUT: 'CheckedOut',
};

export const MEDICATION_STATUSES = {
  COMPLETED: 'Completed',
  FULFILLED: 'Fulfilled',
  REQUESTED: 'Requested',
};

export const APPOINTMENT_STATUSES = {
  ATTENDED: 'Attended',
  SCHEDULED: 'Scheduled',
  CANCELED: 'Canceled',
  MISSED: 'Missed',
};

export const OPERATION_PLAN_STATUSES = {
  PLANNED: 'Planned',
  DROPPED: 'Dropped',
  COMPLETED: 'Completed',
};

export const IMAGING_REQUEST_STATUS_TYPES = {
  PENDING: 'pending',
  COMPLETED: 'completed',
};

export const AVPU_OPTIONS = [
  { value: 'alert', label: 'Alert' },
  { value: 'verbal', label: 'Verbal' },
  { value: 'pain', label: 'Pain' },
  { value: 'unresponsive', label: 'Unresponsive' },
];

export const REFERENCE_TYPES = {
  ICD10: 'icd10',
  ALLERGY: 'allergy',
  CONDITION: 'condition',
  DRUG: 'drug',
  TRIAGE_REASON: 'triageReason',
  PROCEDURE_TYPE: 'procedureType',
  IMAGING_TYPE: 'imagingType',
  LAB_TEST_CATEGORY: 'labTestCategory',
  LAB_TEST_TYPE: 'labTestType',
  LAB_TEST_PRIORITY: 'labTestPriority',
  FACILITY: 'facility',
  LOCATION: 'location',
  DEPARTMENT: 'department',
  VACCINE: 'vaccine',
  VILLAGE: 'village',
  CARE_PLAN: 'carePlan',
  ETHNICITY: 'ethnicity',
  NATIONALITY: 'nationality',
  COUNTRY: 'country',
  DIVISION: 'division',
  SUBDIVISION: 'subdivision',
  MEDICAL_AREA: 'medicalArea',
  NURSING_ZONE: 'nursingZone',
  SETTLEMENT: 'settlement',
  OCCUPATION: 'occupation',
  SEX: 'sex',
  PLACE_OF_BIRTH: 'placeOfBirth',
  MARITAL_STATUS: 'maritalStatus',
  RELIGION: 'religion',
  FAMILY_RELATION: 'familyRelation',
  PATIENT_TYPE: 'patientType',
  BLOOD_TYPE: 'bloodType',
  SOCIAL_MEDIA_PLATFORM: 'socialMediaPlatform',
  PATIENT_BILLING_TYPE: 'patientBillingType',
};

export const REFERENCE_TYPE_VALUES = Object.values(REFERENCE_TYPES);

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
};
export const PROGRAM_DATA_ELEMENT_TYPE_VALUES = Object.values(PROGRAM_DATA_ELEMENT_TYPES);

export const REPORT_REQUEST_STATUSES = {
  RECEIVED: 'Received',
  PROCESSED: 'Processed',
  ERROR: 'Error',
};

export const REPORT_REQUEST_STATUS_VALUES = Object.values(REPORT_REQUEST_STATUSES);

export const DIAGNOSIS_CERTAINTY = {
  SUSPECTED: 'suspected',
  CONFIRMED: 'confirmed',
};

export const DIAGNOSIS_CERTAINTY_VALUES = Object.values(DIAGNOSIS_CERTAINTY);

export const PATIENT_COMMUNICATION_CHANNELS = {
  EMAIL: 'Email',
  SMS: 'Sms',
  WHATSAPP: 'WhatsApp',
};

export const PATIENT_COMMUNICATION_CHANNELS_VALUES = Object.values(PATIENT_COMMUNICATION_CHANNELS);

export const PATIENT_COMMUNICATION_TYPES = {
  REFERRAL_CREATED: 'Referral created',
};

export const PATIENT_COMMUNICATION_TYPES_VALUES = Object.values(PATIENT_COMMUNICATION_TYPES);

export const SURVEY_TYPES = {
  PROGRAMS: 'programs',
  REFERRAL: 'referral',
  OBSOLETE: 'obsolete',
};

export const COMMUNICATION_STATUSES = {
  QUEUED: 'Queued',
  PROCESSED: 'Processed',
  SENT: 'Sent',
  ERROR: 'Error',
  DELIVERED: 'Delivered',
  BAD_FORMAT: 'Bad Format',
};

export const COMMUNICATION_STATUSES_VALUES = Object.values(COMMUNICATION_STATUSES);

export const SYNC_DIRECTIONS = {
  DO_NOT_SYNC: 'do_not_sync',
  PUSH_ONLY: 'push_only',
  PULL_ONLY: 'pull_only',
  BIDIRECTIONAL: 'bidirectional',
};

// these are arbitrary, the only thing that matters is they are shared between desktop and lan
export const DISCOVERY_PORT = 53391;
export const DISCOVERY_MAGIC_STRING = 'ee671721-9d4d-4e0e-b231-81872206a735';

export const VERSION_COMPATIBILITY_ERRORS = {
  LOW: 'Client version too low',
  HIGH: 'Client version too high',
};

export const VACCINE_CATEGORIES = {
  ROUTINE: 'Routine',
  CATCHUP: 'Catchup',
  CAMPAIGN: 'Campaign',
};

export const VACCINE_CATEGORIES_VALUES = Object.values(VACCINE_CATEGORIES);

export const INJECTION_SITE_OPTIONS = {
  LEFT_ARM: 'Left arm',
  RIGHT_ARM: 'Right arm',
  LEFT_THIGH: 'Left thigh',
  RIGHT_THIGH: 'Right thigh',
  ORAL: 'Oral',
  OTHER: 'Other',
};
