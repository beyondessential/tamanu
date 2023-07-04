import { IPatient } from './IPatient';
import { IReferenceData } from './IReferenceData';

export interface IPatientAdditionalData {
  patient: IPatient;
  bloodType?: string;
  title?: string;
  primaryContactNumber?: string;
  secondaryContactNumber?: string;
  cityTown?: string;
  placeOfBirth?: string;
  maritalStatus?: string;
  streetVillage?: string;
  educationalLevel?: string;
  socialMedia?: string;
  birthCertificate?: string;
  drivingLicense?: string;
  passport?: string;
  emergencyContactName?: string,
  emergencyContactNumber?: string,
  nationality?: IReferenceData;
  country?: IReferenceData;
  division?: IReferenceData;
  subdivision?: IReferenceData;
  medicalArea?: IReferenceData;
  nursingZone?: IReferenceData;
  settlement?: IReferenceData;
  ethnicity?: IReferenceData;
  occupation?: IReferenceData;
  countryOfBirth?: IReferenceData;
  religion?: IReferenceData;
  patientBillingType?: IReferenceData;
  nationalityId?: string;
  countryId?: string;
  divisionId?: string;
  subdivisionId?: string;
  medicalAreaId?: string;
  nursingZoneId?: string;
  settlementId?: string;
  ethnicityId?: string;
  occupationId?: string;
  countryOfBirthId?: string;
  religionId?: string;
  patientBillingTypeId?: string;
}
