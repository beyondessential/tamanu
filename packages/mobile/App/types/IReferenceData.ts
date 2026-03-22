import { VisibilityStatus } from '~/visibilityStatuses';
import { ReferenceDataRelation } from '~/models/ReferenceDataRelation';

export const ReferenceDataType = {
  Allergy: 'allergy',
  BookingType: 'bookingType',
  Catchment: 'catchment',
  ContactRelationship: 'contactRelationship',
  Country: 'country',
  Division: 'division',
  Diet: 'diet',
  Drug: 'drug',
  Diagnosis: 'diagnosis',
  DiseaseCoding: 'diseaseCoding',
  ImagingType: 'imagingType',
  LabTestCategory: 'labTestCategory',
  LabSampleSite: 'labSampleSite',
  LabTestPriority: 'labTestPriority',
  LabTestType: 'labTestType',
  PatientIdType: 'patientIdType',
  ProcedureType: 'procedureType',
  Settlement: 'settlement',
  SpecimenType: 'specimenType',
  SubDivision: 'subdivision',
  TriageReason: 'triageReason',
  Vaccine: 'vaccine',
  VaccineNotGivenReason: 'vaccineNotGivenReason',
  Village: 'village',
  NoteType: 'noteType',
} as const;

export type ReferenceDataType = (typeof ReferenceDataType)[keyof typeof ReferenceDataType];

export const ReferenceDataRelationType = {
  AddressHierarchy: 'address_hierarchy',
  FacilityCatchment: 'facility_catchment',
} as const;

export type ReferenceDataRelationType =
  (typeof ReferenceDataRelationType)[keyof typeof ReferenceDataRelationType];

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
