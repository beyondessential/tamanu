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
  TREATMENT_PLAN: 'notetype-treatmentPlan',
  DISCHARGE: 'notetype-discharge',
  AREA_TO_BE_IMAGED: 'notetype-areaToBeImaged',
  RESULT_DESCRIPTION: 'notetype-resultDescription',
  SYSTEM: 'notetype-system',
  OTHER: 'notetype-other',
  CLINICAL_MOBILE: 'notetype-clinicalMobile',
  HANDOVER: 'notetype-handover',
};

export const NOTE_PERMISSION_TYPES = {
  OTHER_PRACTITIONER_ENCOUNTER_NOTE: 'OtherPractitionerEncounterNote',
  TREATMENT_PLAN_NOTE: 'TreatmentPlanNote',
};

export const NOTE_RECORD_TYPE_VALUES = Object.values(NOTE_RECORD_TYPES);
export const NOTE_TYPE_VALUES = Object.values(NOTE_TYPES);
