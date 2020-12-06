export enum ReferenceDataType {
  ICD10 = 'icd10',
  Allergy = 'allergy',
  Condition = 'condition',
  Drug = 'drug',
  TriageReason = 'triageReason',
  ProcedureType = 'procedureType',
  ImagingType = 'imagingType',
  LabTestCategory = 'labTestCategory',
  LabTestType = 'labTestType',
  Facility = 'facility',
  Location = 'location',
  Department = 'department',
  Village = 'village',
  Vaccine = 'vaccine',
}

export interface IReferenceData {
  id: string;

  name: string;
  code: string;
  type: ReferenceDataType;
}
