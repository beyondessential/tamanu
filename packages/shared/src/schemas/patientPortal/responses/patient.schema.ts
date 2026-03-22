import { z } from 'zod';
import { SEX_VALUES } from '@tamanu/constants';
import { ReferenceDataSchema } from './referenceData.schema';

export const PatientAdditionalDataSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  placeOfBirth: z.string().nullish(),
  bloodType: z.string().nullish(),
  primaryContactNumber: z.string().nullish(),
  secondaryContactNumber: z.string().nullish(),
  maritalStatus: z.string().nullish(),
  cityTown: z.string().nullish(),
  streetVillage: z.string().nullish(),
  educationalLevel: z.string().nullish(),
  socialMedia: z.string().nullish(),
  title: z.string().nullish(),
  birthCertificate: z.string().nullish(),
  drivingLicense: z.string().nullish(),
  passport: z.string().nullish(),
  passportNumber: z.string().nullish(),
  emergencyContactName: z.string().nullish(),
  emergencyContactNumber: z.string().nullish(),
  motherId: z.string().nullish(),
  fatherId: z.string().nullish(),
  healthCenterId: z.string().nullish(),
  secondaryVillageId: z.string().nullish(),
  updatedAtByField: z.record(z.string(), z.any()).nullish(),
  insurerPolicyNumber: z.string().nullish(),
  registeredById: z.string().nullish(),
  nationalityId: z.string().nullish(),
  countryId: z.string().nullish(),
  divisionId: z.string().nullish(),
  subdivisionId: z.string().nullish(),
  medicalAreaId: z.string().nullish(),
  nursingZoneId: z.string().nullish(),
  settlementId: z.string().nullish(),
  ethnicityId: z.string().nullish(),
  occupationId: z.string().nullish(),
  religionId: z.string().nullish(),
  patientBillingTypeId: z.string().nullish(),
  countryOfBirthId: z.string().nullish(),
  insurerId: z.string().nullish(),
  // Reference data relations
  nationality: ReferenceDataSchema.nullish(),
  country: ReferenceDataSchema.nullish(),
  division: ReferenceDataSchema.nullish(),
  subdivision: ReferenceDataSchema.nullish(),
  medicalArea: ReferenceDataSchema.nullish(),
  nursingZone: ReferenceDataSchema.nullish(),
  settlement: ReferenceDataSchema.nullish(),
  ethnicity: ReferenceDataSchema.nullish(),
  occupation: ReferenceDataSchema.nullish(),
  religion: ReferenceDataSchema.nullish(),
  patientBillingType: ReferenceDataSchema.nullish(),
  countryOfBirth: ReferenceDataSchema.nullish(),
  insurer: ReferenceDataSchema.nullish(),
});

export const PatientSchema = z.object({
  id: z.string(),
  displayId: z.string(),
  firstName: z.string(),
  middleName: z.string().nullish(),
  lastName: z.string(),
  dateOfBirth: z.string(),
  sex: z.enum(SEX_VALUES),
  village: ReferenceDataSchema.nullish(),
});

export const PatientWithAdditionalDataSchema = PatientSchema.extend({
  additionalData: PatientAdditionalDataSchema.nullish(),
});

export type Patient = z.infer<typeof PatientSchema>;
export type PatientWithAdditionalData = z.infer<typeof PatientWithAdditionalDataSchema>;
