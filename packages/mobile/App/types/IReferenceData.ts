import { VisibilityStatus } from '~/visibilityStatuses';
import { ReferenceDataRelation } from '~/models/ReferenceDataRelation';

export enum ReferenceDataType {
  Allergy = 'allergy',
  Catchment = 'catchment',
  Condition = 'condition',
  ContactRelationship = 'contactRelationship',
  Country = 'country',
  Division = 'division',
  Diet = 'diet',
  Drug = 'drug',
  ICD10 = 'icd10',
  ImagingType = 'imagingType',
  LabTestCategory = 'labTestCategory',
  LabSampleSite = 'labSampleSite',
  LabTestPriority = 'labTestPriority',
  LabTestType = 'labTestType',
  PatientIdType = 'patientIdType',
  ProcedureType = 'procedureType',
  Settlement = 'settlement',
  SpecimenType = 'specimenType',
  SubDivision = 'subdivision',
  TriageReason = 'triageReason',
  Vaccine = 'vaccine',
  VaccineNotGivenReason = 'vaccineNotGivenReason',
  Village = 'village',
}

export enum ReferenceDataRelationType {
  AddressHierarchy = 'address_hierarchy',
  FacilityCatchment = 'facility_catchment',
}

export interface IReferenceData {
  id: string;
  name: string;
  code: string;
  type: ReferenceDataType;
  visibilityStatus: VisibilityStatus;
  parents?: ReferenceDataRelation[];
}

export interface IReferenceDataRelation {
  id: string;
  referenceDataParentId: string;
  referenceDataId: string;
  type: ReferenceDataRelationType;
}
