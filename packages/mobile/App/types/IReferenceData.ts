import { VisibilityStatus } from '~/visibilityStatuses';

export enum ReferenceDataType {
  Allergy = 'allergy',
  Condition = 'condition',
  Drug = 'drug',
  ICD10 = 'icd10',
  ImagingType = 'imagingType',
  LabTestCategory = 'labTestCategory',
  LabSampleSite = 'labSampleSite',
  LabTestPriority = 'labTestPriority',
  LabTestType = 'labTestType',
  PatientIdType = 'patientIdType',
  ProcedureType = 'procedureType',
  SpecimenType = 'specimenType',
  TriageReason = 'triageReason',
  Vaccine = 'vaccine',
  VaccineNotGivenReason = 'vaccineNotGivenReason',
  Village = 'village',
}

export interface IReferenceData {
  id: string;

  name: string;
  code: string;
  type: ReferenceDataType;
  visibilityStatus: VisibilityStatus;
}
