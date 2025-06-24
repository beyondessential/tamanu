import { z } from 'zod';
import {
  PATIENT_REGISTRY_TYPES,
  SEX_VALUES,
  BLOOD_TYPES,
  MARTIAL_STATUS_VALUES,
  TITLES,
  BIRTH_TYPES,
  EDUCATIONAL_ATTAINMENT_TYPES,
  SOCIAL_MEDIA_TYPES,
  ATTENDANT_OF_BIRTH_TYPES,
  BIRTH_DELIVERY_TYPES,
  PLACE_OF_BIRTH_TYPES,
} from '@tamanu/constants';
import { datetimeCustomValidation } from '@tamanu/utils/dateTime';
import { foreignKey } from '@tamanu/shared/schemas/types';

export const createPatientSchema = z.object({
  // Required fields for patient creation
  patientRegistryType: z.enum(Object.values(PATIENT_REGISTRY_TYPES)),
  facilityId: foreignKey,

  // Primary Details (from GenericPrimaryDetailsLayout)
  displayId: z.string().optional(),
  firstName: z.string().optional(),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
  culturalName: z.string().optional(),
  email: z.string().email().optional(),
  dateOfBirth: datetimeCustomValidation.optional(),
  sex: z.enum([SEX_VALUES.MALE, SEX_VALUES.FEMALE, SEX_VALUES.OTHER]),
  villageId: foreignKey.optional(),

  // Identification Information (from GenericIdentificationFields)
  birthCertificate: z.string().optional(),
  drivingLicense: z.string().optional(),
  passport: z.string().optional(),
  insurerId: foreignKey.optional(),
  insurerPolicyNumber: z.string().optional(),

  // Contact Information (from GenericContactFields)
  primaryContactNumber: z.string().optional(),
  secondaryContactNumber: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactNumber: z.string().optional(),

  // Personal Information (from GenericPersonalFields)
  title: z
    .enum([TITLES.MR, TITLES.MRS, TITLES.MS, TITLES.MISS, TITLES.DR, TITLES.SR, TITLES.SN])
    .optional(),
  maritalStatus: z.enum(Object.values(MARTIAL_STATUS_VALUES)).optional(),
  bloodType: z.enum(Object.values(BLOOD_TYPES)).optional(),
  placeOfBirth: z.string().optional(),
  countryOfBirthId: foreignKey.optional(),
  nationalityId: foreignKey.optional(),
  ethnicityId: foreignKey.optional(),
  religionId: foreignKey.optional(),
  educationalLevel: z.enum(Object.values(EDUCATIONAL_ATTAINMENT_TYPES)).optional(),
  occupationId: foreignKey.optional(),
  socialMedia: z.enum(Object.values(SOCIAL_MEDIA_TYPES)).optional(),
  patientBillingTypeId: foreignKey.optional(),
  motherId: foreignKey.optional(),
  fatherId: foreignKey.optional(),

  // Location Information (from GenericLocationFields)
  cityTown: z.string().optional(),
  streetVillage: z.string().optional(),
  countryId: foreignKey.optional(),
  divisionId: foreignKey.optional(),
  subdivisionId: foreignKey.optional(),
  settlementId: foreignKey.optional(),
  medicalAreaId: foreignKey.optional(),
  nursingZoneId: foreignKey.optional(),

  // Birth Details (from GenericBirthFields - only when patientRegistryType is 'birth_registry')
  timeOfBirth: datetimeCustomValidation.optional(),
  gestationalAgeEstimate: z.number().min(1).max(45).optional(),
  registeredBirthPlace: z.enum(Object.values(PLACE_OF_BIRTH_TYPES)).optional(),
  birthFacilityId: foreignKey.optional(),
  attendantAtBirth: z.enum(Object.values(ATTENDANT_OF_BIRTH_TYPES)).optional(),
  nameOfAttendantAtBirth: z.string().optional(),
  birthDeliveryType: z.enum(Object.values(BIRTH_DELIVERY_TYPES)).optional(),
  birthType: z.enum(Object.values(BIRTH_TYPES)).optional(),
  birthWeight: z.number().min(0).max(6).optional(),
  birthLength: z.number().min(0).max(100).optional(),
  apgarScoreOneMinute: z.number().int().min(1).max(10).optional(),
  apgarScoreFiveMinutes: z.number().int().min(1).max(10).optional(),
  apgarScoreTenMinutes: z.number().int().min(1).max(10).optional(),

  // Custom patient fields (dynamic field definitions)
  patientFields: z.record(z.string(), z.string()).optional(),

  // Backend-added fields (not from frontend form)
  registeredById: foreignKey,
});

export const updatePatientSchema = createPatientSchema.partial().omit({
  patientRegistryType: true,
});
