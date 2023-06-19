export const NOTE_RECORD_TYPES = {
  ENCOUNTER: 'Encounter',
  PATIENT: 'Patient',
  TRIAGE: 'Triage',
  PATIENT_CARE_PLAN: 'PatientCarePlan',
  LAB_REQUEST: 'LabRequest',
  IMAGING_REQUEST: 'ImagingRequest',
  // IMPORTANT: if you add any more record types, you must also alter buildNoteLinkedSyncFilter
};

export const NOTE_RECORD_TYPE_VALUES = Object.values(NOTE_RECORD_TYPES);
