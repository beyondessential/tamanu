export const ENCOUNTER_TYPES = {
  ADMISSION: 'admission',
  CLINIC: 'clinic',
  IMAGING: 'imaging',
  EMERGENCY: 'emergency',
  OBSERVATION: 'observation',
  TRIAGE: 'triage',
  SURVEY_RESPONSE: 'surveyResponse',
  VACCINATION: 'vaccination',
};

export const ENCOUNTER_LABELS = {
  [ENCOUNTER_TYPES.ADMISSION]: 'Hospital admission',
  [ENCOUNTER_TYPES.TRIAGE]: 'Triage',
  [ENCOUNTER_TYPES.CLINIC]: 'Clinic',
  [ENCOUNTER_TYPES.IMAGING]: 'Imaging',
  [ENCOUNTER_TYPES.EMERGENCY]: 'Emergency short stay',
  [ENCOUNTER_TYPES.OBSERVATION]: 'Active ED patient',
  [ENCOUNTER_TYPES.SURVEY_RESPONSE]: 'Form response',
  [ENCOUNTER_TYPES.VACCINATION]: 'Vaccination record',
};

export const ENCOUNTER_TYPE_VALUES = Object.values(ENCOUNTER_TYPES);
