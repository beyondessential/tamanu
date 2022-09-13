export const PATIENT_CATEGORIES = {
  ALL: 'all',
  EMERGENCY: 'emergency',
  INPATIENT: 'inpatient',
  OUTPATIENT: 'outpatient',
};

export const PATIENT_CATEGORY_TO_TITLE = {
  [PATIENT_CATEGORIES.ALL]: 'All Patients',
  [PATIENT_CATEGORIES.EMERGENCY]: 'Emergency Patients',
  [PATIENT_CATEGORIES.OUTPATIENT]: 'Outpatients',
  [PATIENT_CATEGORIES.INPATIENT]: 'Inpatients',
};

const CATEGORY_PATH = `/patients/:category(${Object.values(PATIENT_CATEGORIES).join('|')})`;
const PATIENT_PATH = `${CATEGORY_PATH}/:patientId`;
const ENCOUNTER_PATH = `${PATIENT_PATH}/encounter/:encounterId`;
const SUMMARY_PATH = `${ENCOUNTER_PATH}/summary`;
const LAB_REQUEST_PATH = `${ENCOUNTER_PATH}/lab-request/:labRequestId`;
const IMAGING_REQUEST_PATH = `${ENCOUNTER_PATH}/imaging-request/:imagingRequestId`;

export const PATIENT_PATHS = {
  CATEGORY: CATEGORY_PATH,
  PATIENT: PATIENT_PATH,
  ENCOUNTER: ENCOUNTER_PATH,
  SUMMARY: SUMMARY_PATH,
  LAB_REQUEST: LAB_REQUEST_PATH,
  IMAGING_REQUEST: IMAGING_REQUEST_PATH,
};
