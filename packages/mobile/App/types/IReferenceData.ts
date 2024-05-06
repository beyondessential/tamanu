import { VisibilityStatus } from '~/visibilityStatuses';
import { ReferenceDataRelation } from '~/models/ReferenceDataRelation';

export enum ReferenceDataType {
  Allergy = 'allergy',
  Condition = 'condition',
  ContactRelationship = 'contactRelationship',
  Drug = 'drug',
  Diet = 'diet',
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
  parents?: ReferenceDataRelation[];
}

export enum ReferenceDataRelationType {
  AddressHierarchy = 'address_hierarchy',
  FacilityCatchment = 'facility_catchment',
}

export interface IReferenceDataRelation {
  id: string;
  referenceDataParentId: string;
  referenceDataId: string;
  type: ReferenceDataRelationType;
}
