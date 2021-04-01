import { IPatient } from './IPatient';
import { IReferenceData } from './IReferenceData';

export interface IPatientAdditionalData {
  patient: IPatient;
  bloodType?: string;
  primaryContactNumber?: string;
  secondaryContactNumber?: string;
  cityTown?: string;
  placeOfBirth?: string;
  maritalStatus?: string;
  streetVillage?: string;
  educationalLevel?: string;
  socialMedia?: string;
  nationality?: IReferenceData;
  country?: IReferenceData;
  division?: IReferenceData;
  subdivision?: IReferenceData;
  medicalArea?: IReferenceData;
  nursingZone?: IReferenceData;
  settlement?: IReferenceData;
  ethnicity?: IReferenceData;
  occupation?: IReferenceData;
  nationalityId?: string;
  countryId?: string;
  divisionId?: string;
  subdivisionId?: string;
  medicalAreaId?: string;
  nursingZoneId?: string;
  settlementId?: string;
  ethnicityId?: string;
  occupationId?: string;

  markedForSync?: boolean;
}
