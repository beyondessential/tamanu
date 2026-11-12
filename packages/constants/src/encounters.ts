export const ENCOUNTER_TYPES = {
  ADMISSION: 'admission',
  CLINIC: 'clinic',
  IMAGING: 'imaging',
  EMERGENCY: 'emergency',
  OBSERVATION: 'observation',
  TRIAGE: 'triage',
  SURVEY_RESPONSE: 'surveyResponse',
  VACCINATION: 'vaccination',
} as const;

export type EncounterType = (typeof ENCOUNTER_TYPES)[keyof typeof ENCOUNTER_TYPES];

export const ENCOUNTER_TYPE_LABELS = {
  [ENCOUNTER_TYPES.ADMISSION]: 'Hospital admission',
  [ENCOUNTER_TYPES.TRIAGE]: 'Triage',
  [ENCOUNTER_TYPES.CLINIC]: 'Clinic',
  [ENCOUNTER_TYPES.IMAGING]: 'Imaging',
  [ENCOUNTER_TYPES.EMERGENCY]: 'Emergency short stay',
  [ENCOUNTER_TYPES.OBSERVATION]: 'Active ED care',
  [ENCOUNTER_TYPES.SURVEY_RESPONSE]: 'Form response',
  [ENCOUNTER_TYPES.VACCINATION]: 'Vaccination record',
} as const;

export const ENCOUNTER_TYPE_VALUES = Object.values(ENCOUNTER_TYPES);

// How staff describe the kind of care an encounter is. Form response and vaccination record
// encounters close as soon as they're created, so they carry no patient status.
export const PATIENT_STATUSES = {
  INPATIENT: 'inpatient',
  OUTPATIENT: 'outpatient',
  EMERGENCY: 'emergency',
} as const;

export type PatientStatus = (typeof PATIENT_STATUSES)[keyof typeof PATIENT_STATUSES];

export const PATIENT_STATUS_LABELS = {
  [PATIENT_STATUSES.INPATIENT]: 'Inpatient',
  [PATIENT_STATUSES.OUTPATIENT]: 'Outpatient',
  [PATIENT_STATUSES.EMERGENCY]: 'Emergency',
} as const;

export const ENCOUNTER_TYPE_PATIENT_STATUSES: Partial<Record<EncounterType, PatientStatus>> = {
  [ENCOUNTER_TYPES.ADMISSION]: PATIENT_STATUSES.INPATIENT,
  [ENCOUNTER_TYPES.CLINIC]: PATIENT_STATUSES.OUTPATIENT,
  [ENCOUNTER_TYPES.IMAGING]: PATIENT_STATUSES.OUTPATIENT,
  [ENCOUNTER_TYPES.TRIAGE]: PATIENT_STATUSES.EMERGENCY,
  [ENCOUNTER_TYPES.OBSERVATION]: PATIENT_STATUSES.EMERGENCY,
  [ENCOUNTER_TYPES.EMERGENCY]: PATIENT_STATUSES.EMERGENCY,
};

export const ENCOUNTER_TYPE_ABBREVIATION_LABELS = {
  [ENCOUNTER_TYPES.ADMISSION]: 'HA',
  [ENCOUNTER_TYPES.TRIAGE]: 'T',
  [ENCOUNTER_TYPES.CLINIC]: 'C',
  [ENCOUNTER_TYPES.IMAGING]: 'I',
  [ENCOUNTER_TYPES.EMERGENCY]: 'ESS',
  [ENCOUNTER_TYPES.OBSERVATION]: 'AEC',
  [ENCOUNTER_TYPES.SURVEY_RESPONSE]: 'FR',
  [ENCOUNTER_TYPES.VACCINATION]: 'VR',
} as const;
