import { IReferenceData } from './IReferenceData';

export interface IPatient {
  id: string;
  displayId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  sex: string;
  dateOfBirth: Date;
  culturalName?: string;
  bloodType?: string;
  primaryContactNumber?: string;
  secondaryContactNumber?: string;
  maritalStatus?: string;
  cityTown?: string;
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
