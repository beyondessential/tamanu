import { IMAGING_AREA_TYPES } from '@tamanu/constants';
import {
  CARE_PLANS,
  DRUGS,
  DIAGNOSES,
  splitIds,
  TRIAGE_DIAGNOSES,
  APPOINTMENT_TYPES,
} from '@tamanu/database/demoData';
import {
  CT_SCAN_IMAGING_AREAS,
  ULTRASOUND_IMAGING_AREAS,
  X_RAY_IMAGING_AREAS,
} from '@tamanu/database/demoData/imagingAreas';

export const testDiagnoses = DIAGNOSES.slice(0, 50);
export const testDrugs = DRUGS.slice(0, 50);
export const testTriageReasons = TRIAGE_DIAGNOSES.map((x) => ({ ...x, type: 'triageReason' }));
export const testAppointmentTypes = APPOINTMENT_TYPES.map((x) => ({
  ...x,
  id: `appointmentType-${x.id}`,
  type: 'appointmentType',
}));

export const testImagingAreas = [
  ...X_RAY_IMAGING_AREAS.map((x) => ({
    ...x,
    id: `xray-${x.id}`,
    type: IMAGING_AREA_TYPES.X_RAY_IMAGING_AREA,
  })),
  ...CT_SCAN_IMAGING_AREAS.map((x) => ({
    ...x,
    id: `ct-${x.id}`,
    type: IMAGING_AREA_TYPES.CT_SCAN_IMAGING_AREA,
  })),
  ...ULTRASOUND_IMAGING_AREAS.map((x) => ({
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
`).map((x) => ({ ...x, type: 'allergy' }));

export const testVillages = splitIds(`
  Auki
  Buala
  Gizo
  Honiara
  Noro
  Tulagi
`).map((x) => ({ ...x, type: 'village' }));

export const testImagingTypes = splitIds(`
  X-Ray
  CT Scan
  Ultrasound
`).map((x) => ({ ...x, type: 'imagingType' }));

export const testSecondaryIdTypes = splitIds(`
  National Healthcare Number
  RISPACs ID
  Test ID type
`).map((x) => ({ ...x, type: 'secondaryIdType' }));

export const allSeeds = [
  ...testDiagnoses,
  ...testDrugs,
  ...testTriageReasons,
  ...testImagingTypes,
  ...testImagingAreas,
  ...testVillages,
  ...testAllergies,
  ...testSecondaryIdTypes,
  ...testAppointmentTypes,
  ...CARE_PLANS,
];
