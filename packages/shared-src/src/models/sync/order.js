export const MODEL_DEPENDENCY_ORDER = [
  'ReferenceData',
  'User',
  'Facility',
  'Department',
  'Location',

  'Patient',
  'Encounter',

  'PatientAllergy',
  'PatientCarePlan',
  'PatientCondition',
  'PatientFamilyHistory',
  'PatientIssue',
  'PatientAdditionalData',

  'EncounterDiagnosis',
  'EncounterMedication',
  'Procedure',
  'Referral',
  'Vitals',
  'Triage',

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
];

const lowercaseModelOrder = MODEL_DEPENDENCY_ORDER.map(x => x.toLowerCase());

export const compareModelPriority = (modelNameA, modelNameB) => {
  const priorityA = lowercaseModelOrder.indexOf(modelNameA.toLowerCase());
  const priorityB = lowercaseModelOrder.indexOf(modelNameB.toLowerCase());
  const delta = priorityA - priorityB;
  if (delta) return delta;

  return modelNameA.localeCompare(modelNameB);
};
