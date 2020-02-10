import { ICD10_DIAGNOSES, TRIAGE_DIAGNOSES, DRUGS } from 'shared/demoData';
import { splitIds } from 'shared/demoData/splitIds';

export const testDiagnoses = ICD10_DIAGNOSES.slice(0, 50);
export const testDrugs = DRUGS.slice(0, 50);
export const testTriageReasons = TRIAGE_DIAGNOSES;

export const testLocations = splitIds(`
  Ward 1
  Ward 2
  Ward 3
  Ward 4
  Ward 5
`).map(x => ({ ...x, type: 'location' }));

export const testDepartments = splitIds(`
  A&E
  General
  ICU
  Maternity
  Neurology
  Oncology
  Radiology
`).map(x => ({ ...x, type: 'department' }));

export const allSeeds = [
  ...testDiagnoses,
  ...testDrugs,
  ...testTriageReasons,
  ...testLocations,
  ...testDepartments,
];
