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

// Note types that should not be user-editable or creatable via UI
export const NON_EDITABLE_NOTE_TYPES = [
  NOTE_TYPES.SYSTEM,
  NOTE_TYPES.CLINICAL_MOBILE,
];

export const NOTE_TYPE_LABELS = {
  [NOTE_TYPES.TREATMENT_PLAN]: 'Treatment plan',
  [NOTE_TYPES.ADMISSION]: 'Admission',
  [NOTE_TYPES.CLINICAL_MOBILE]: 'Clinical note (mobile)',
  [NOTE_TYPES.DIETARY]: 'Dietary',
  [NOTE_TYPES.DISCHARGE]: 'Discharge planning',
  [NOTE_TYPES.HANDOVER]: 'Handover note',
  [NOTE_TYPES.MEDICAL]: 'Medical',
  [NOTE_TYPES.NURSING]: 'Nursing',
  [NOTE_TYPES.OTHER]: 'Other',
  [NOTE_TYPES.PHARMACY]: 'Pharmacy',
  [NOTE_TYPES.PHYSIOTHERAPY]: 'Physiotherapy',
  [NOTE_TYPES.SOCIAL]: 'Social welfare',
  [NOTE_TYPES.SURGICAL]: 'Surgical',
  [NOTE_TYPES.SYSTEM]: 'System',
};

export const NOTE_PERMISSION_TYPES = {
  OTHER_PRACTITIONER_ENCOUNTER_NOTE: 'OtherPractitionerEncounterNote',
  TREATMENT_PLAN_NOTE: 'TreatmentPlanNote',
};

export const NOTE_RECORD_TYPE_VALUES = Object.values(NOTE_RECORD_TYPES);
export const NOTE_TYPE_VALUES = Object.values(NOTE_TYPES);
