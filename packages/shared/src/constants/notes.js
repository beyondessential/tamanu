export const NOTE_RECORD_TYPES = {
  ENCOUNTER: 'Encounter',
  PATIENT: 'Patient',
  TRIAGE: 'Triage',
  PATIENT_CARE_PLAN: 'PatientCarePlan',
  LAB_REQUEST: 'LabRequest',
  IMAGING_REQUEST: 'ImagingRequest',
  // IMPORTANT: if you add any more record types, you must also alter buildNoteLinkedSyncFilter
};

export const NOTE_TYPES = {
  TREATMENT_PLAN: 'treatmentPlan',
  ADMISSION: 'admission',
  MEDICAL: 'medical',
  SURGICAL: 'surgical',
  NURSING: 'nursing',
  DIETARY: 'dietary',
  PHARMACY: 'pharmacy',
  PHYSIOTHERAPY: 'physiotherapy',
  SOCIAL: 'social',
  DISCHARGE: 'discharge',
  AREA_TO_BE_IMAGED: 'areaToBeImaged',
  RESULT_DESCRIPTION: 'resultDescription',
  SYSTEM: 'system',
  OTHER: 'other',
  CLINICAL_MOBILE: 'clinicalMobile',
  HANDOVER: 'handover',
};

export const NOTE_PERMISSION_TYPES = {
  OTHER_PRACTITIONER_ENCOUNTER_NOTE: 'OtherPractitionerEncounterNote',
  TREATMENT_PLAN_NOTE: 'TreatmentPlanNote',
};

export const NOTE_RECORD_TYPE_VALUES = Object.values(NOTE_RECORD_TYPES);
export const NOTE_TYPE_VALUES = Object.values(NOTE_TYPES);
