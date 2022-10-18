export const MODEL_DEPENDENCY_ORDER = [
  'ReferenceData',
  'Asset',
  'Facility',
  'Department',
  'Location',
  'Role',
  'Permission',

  'User',
  'UserFacility',

  'LabTestType',

  'Program',
  'ProgramDataElement',
  'Survey',
  'SurveyScreenComponent',

  'InvoiceLineType',
  'InvoicePriceChangeType',

  'ScheduledVaccine',

  'Patient',
  'Encounter',

  'PatientAllergy',
  'PatientCarePlan',
  'PatientCondition',
  'PatientFamilyHistory',
  'PatientIssue',
  'PatientAdditionalData',
  'PatientSecondaryId',

  'PatientFieldDefinitionCategory',
  'PatientFieldDefinition',
  'PatientFieldValue',

  'PatientDeathData',
  'PatientBirthData',
  'ContributingDeathCause',

  'EncounterDiagnosis',
  'EncounterMedication',
  'Procedure',
  'Referral',
  'Vitals',
  'Triage',

  'CertifiableVaccine',
  'AdministeredVaccine',


  'SurveyResponse',
  'SurveyResponseAnswer',

  'LabTest',
  'LabRequest',
  'ImagingRequest',
  'ImagingRequestAreas',

  'NotePage',
  'NoteItem',

  'ReportDefinition',
  'ReportDefinitionVersion',
  'ReportRequest',

  'PatientCommunication',
  'CertificateNotification',

  'Invoice',
  'InvoiceLineItem',
  'InvoicePriceChangeItem',

  // 'LabRequestLog',
  'DocumentMetadata',
];

const lowercaseModelOrder = MODEL_DEPENDENCY_ORDER.map(x => x.toLowerCase());

export const compareModelPriority = (modelNameA, modelNameB) => {
  const priorityA = lowercaseModelOrder.indexOf(modelNameA.toLowerCase());
  const priorityB = lowercaseModelOrder.indexOf(modelNameB.toLowerCase());
  const delta = priorityA - priorityB;
  if (delta) return delta;

  return modelNameA.localeCompare(modelNameB);
};
