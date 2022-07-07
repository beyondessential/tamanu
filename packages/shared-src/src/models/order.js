export const MODEL_DEPENDENCY_ORDER = [
  'ReferenceData',
  'User',
  'Asset',
  'Facility',
  'Department',
  'Location',
  'UserFacility',

  'Patient',
  'Encounter',

  'PatientAllergy',
  'PatientCarePlan',
  'PatientCondition',
  'PatientFamilyHistory',
  'PatientIssue',
  'PatientAdditionalData',
  'PatientSecondaryId',

  // Temporarily remove death data models from sync as sync cannot handle the foreign key cycle
  // 'DeathCause',
  // 'PatientDeathData',

  'EncounterDiagnosis',
  'EncounterMedication',
  'Procedure',
  'Referral',
  'Vitals',
  'Triage',

  'CertifiableVaccine',
  'ScheduledVaccine',
  'AdministeredVaccine',

  'Program',
  'ProgramDataElement',
  'Survey',
  'SurveyScreenComponent',
  'SurveyResponse',
  'SurveyResponseAnswer',

  'LabTestType',
  'LabTest',
  'LabRequest',
  'ImagingRequest',

  'Note',

  'ReportRequest',
  'PatientCommunication',
  'CertificateNotification',

  'Invoice',
  'InvoiceLineType',
  'InvoiceLineItem',
  'InvoicePriceChangeType',
  'InvoicePriceChangeItem',

  // 'LabRequestLog',
  'DocumentMetadata',
];
