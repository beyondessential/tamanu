import { IPatient } from './IPatient';
import { IReferenceData } from './IReferenceData';

export interface IPatientAdditionalData {
  patient: IPatient;
  bloodType?: string;
  primaryContactNumber?: string;
  secondaryContactNumber?: string;
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

  markedForSync?: boolean;
  lastSynced?: number;
}
