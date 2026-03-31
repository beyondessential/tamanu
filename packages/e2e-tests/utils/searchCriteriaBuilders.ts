import { Patient } from '@tamanu/database';
import { testData } from './testData';
import type { InpatientSearchCriteria } from '@pages/patients/InpatientsPage';
import type { OutpatientSearchCriteria } from '@pages/patients/OutpatientsPage';

export function buildFullInpatientSearchCriteria(
  patient: Patient,
  clinicianDisplayName: string,
): InpatientSearchCriteria {
  return {
    NHN: patient.displayId,
    firstName: patient.firstName,
    lastName: patient.lastName,
    area: testData.areaName,
    department: testData.department,
    clinician: clinicianDisplayName,
    diet: testData.dietName,
    advancedSearch: true,
  };
}

export function buildFullOutpatientSearchCriteria(
  patient: Patient,
  clinicianDisplayName: string,
): OutpatientSearchCriteria {
  return {
    NHN: patient.displayId,
    firstName: patient.firstName,
    lastName: patient.lastName,
    area: testData.areaName,
    department: testData.department,
    clinician: clinicianDisplayName,
    advancedSearch: true,
  };
}
