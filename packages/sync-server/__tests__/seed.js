import { ICD10_DIAGNOSES, TRIAGE_DIAGNOSES, DRUGS } from 'shared/demoData';
import { splitIds } from 'shared/demoData/splitIds';

export const testDiagnoses = ICD10_DIAGNOSES.slice(0, 50);
export const testDrugs = DRUGS.slice(0, 50);
export const testTriageReasons = TRIAGE_DIAGNOSES.map(x => ({ ...x, type: 'triageReason' }));

export const testAllergies = splitIds(`
  Peanuts
  Penicillin
  Cats
  Pollen
  Anaesthetics
  Dye
`).map(x => ({ ...x, type: 'allergy' }));

export const testLocations = splitIds(`
  Ward-1
  Ward-2
  Ward-3
  Ward-4
  Ward-5
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

export const testVillages = splitIds(`
  Auki
  Buala
  Gizo
  Honiara
  Noro
  Tulagi
`).map(x => ({ ...x, type: 'village' }));

export const testImagingTypes = splitIds(`
  X-Ray
  CT Scan
  Ultrasound
`).map(x => ({ ...x, type: 'imagingType' }));

export const allSeeds = [
  ...testDiagnoses,
  ...testDrugs,
  ...testTriageReasons,
  ...testImagingTypes,
  ...testLocations,
  ...testDepartments,
  ...testVillages,
  ...testAllergies,
];
