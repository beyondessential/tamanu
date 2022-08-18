import { IMAGING_AREA_TYPES } from 'shared/constants';
import { ICD10_DIAGNOSES, TRIAGE_DIAGNOSES, DRUGS, CARE_PLANS, splitIds } from 'shared/demoData';
import {
  X_RAY_IMAGING_AREAS,
  CT_SCAN_IMAGING_AREAS,
  ULTRASOUND_IMAGING_AREAS,
} from 'shared/demoData/imagingAreas';

export const testDiagnoses = ICD10_DIAGNOSES.slice(0, 50);
export const testDrugs = DRUGS.slice(0, 50);
export const testTriageReasons = TRIAGE_DIAGNOSES.map(x => ({ ...x, type: 'triageReason' }));

export const testImagingAreas = [
  ...X_RAY_IMAGING_AREAS.map(x => ({
    ...x,
    id: `xray-${x.id}`,
    type: IMAGING_AREA_TYPES.X_RAY_IMAGING_AREA,
  })),
  ...CT_SCAN_IMAGING_AREAS.map(x => ({
    ...x,
    id: `ct-${x.id}`,
    type: IMAGING_AREA_TYPES.CT_SCAN_IMAGING_AREA,
  })),
  ...ULTRASOUND_IMAGING_AREAS.map(x => ({
    ...x,
    id: `ultrasound-${x.id}`,
    type: IMAGING_AREA_TYPES.ULTRASOUND_IMAGING_AREA,
  })),
];

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

export const testFacilities = splitIds(`
  Balwyn
  Hawthorn East
  Kerang
  Lake Charm
  Marla
  Mont Albert
`).map(x => ({ ...x, type: 'facility' }));

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

export const testSecondaryIdTypes = splitIds(`
  National Healthcare Number
  RISPACs ID
  Test ID type
`).map(x => ({ ...x, type: 'secondaryIdType' }));

export const allSeeds = [
  ...testDiagnoses,
  ...testDrugs,
  ...testTriageReasons,
  ...testImagingTypes,
  ...testImagingAreas,
  ...testVillages,
  ...testAllergies,
  ...testSecondaryIdTypes,
  ...CARE_PLANS,
];
