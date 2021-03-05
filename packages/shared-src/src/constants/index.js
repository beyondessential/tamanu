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
  FACILITY: 'facility',
  LOCATION: 'location',
  DEPARTMENT: 'department',
  VACCINE: 'vaccine',
  VILLAGE: 'village',
  CARE_PLAN: 'carePlan'
};

export const REFERENCE_TYPE_VALUES = Object.values(REFERENCE_TYPES);

// for explanation of types, see
// https://docs.google.com/spreadsheets/d/1qwfw1AOED7WiElOCJwt_VHo_JaDhr6ZIiJMqjRCXajQ/edit#gid=1797422705
export const PROGRAM_DATA_ELEMENT_TYPE_VALUES = [
  'FreeText',
  'Multiline',
  'Radio',
  'Select',
  'Date',
  'SubmissionDate',
  'Instruction',
  'Number',
  'Binary',
  'Checkbox',
  'CalculatedQuestion',
  'ConditionQuestion',
  'Arithmetic',
  'Condition',
  'Result',
  // For later versions
  'Autocomplete',
  'Photo',
  // Meditrak-specific
  'Geolocate',
  'DaysSince',
  'MonthsSince',
  'YearsSince',
  'Entity',
  'PrimaryEntity',
  'CodeGenerator',
];

export const REPORT_REQUEST_STATUSES = { RECEIVED: 'Received', PROCESSED: 'Processed' };

export const REPORT_REQUEST_STATUS_VALUES = Object.values(REPORT_REQUEST_STATUSES);

export const DIAGNOSIS_CERTAINTY = {
  SUSPECTED: 'suspected',
  CONFIRMED: 'confirmed',
};

export const DIAGNOSIS_CERTAINTY_VALUES = Object.values(DIAGNOSIS_CERTAINTY);

export const SYNC_DIRECTIONS = {
  DO_NOT_SYNC: 'do_not_sync',
  WRITE_ONLY: 'write_only',
  READ_ONLY: 'read_only',
  BIDIRECTIONAL: 'bidirectional',
};
