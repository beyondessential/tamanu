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
import { foreignKey, stringWithMaxLength } from '@tamanu/shared/schemas/types';

export const createPatientSchema = z.object({
  // Required fields for patient creation
  patientRegistryType: z.enum(PATIENT_REGISTRY_TYPES),
  facilityId: foreignKey,

  // Primary Details (from GenericPrimaryDetailsLayout)
  displayId: z.string().max(255).optional(),
  firstName: z.string().max(255).optional(),
  middleName: z.string().max(255).optional(),
  lastName: z.string().max(255).optional(),
  culturalName: z.string().max(255).optional(),
  email: z.email().max(255).optional(),
  dateOfBirth: datetimeCustomValidation.optional(),
  sex: z.enum(SEX_VALUES),
  villageId: foreignKey.optional(),

  // Identification Information (from GenericIdentificationFields)
  birthCertificate: stringWithMaxLength.optional(),
  drivingLicense: stringWithMaxLength.optional(),
  passport: stringWithMaxLength.optional(),
  // TODO: add max length to insurerId
  insurerId: foreignKey.optional(),
  insurerPolicyNumber: stringWithMaxLength.optional(),

  // Contact Information (from GenericContactFields)
  // Contact numbers are handled as numbers with string coercion to match frontend validation
  primaryContactNumber: z.coerce.number().optional(),
  secondaryContactNumber: z.coerce.number().optional(),
  emergencyContactName: stringWithMaxLength.optional(),
  emergencyContactNumber: z.coerce.number().optional(),

  // Personal Information (from GenericPersonalFields)
  title: z.enum(TITLES).optional(),
  maritalStatus: z.enum(MARTIAL_STATUS_VALUES).optional(),
  bloodType: z.enum(BLOOD_TYPES).optional(),
  placeOfBirth: stringWithMaxLength.optional(),
  countryOfBirthId: foreignKey.optional(),
  nationalityId: foreignKey.optional(),
  ethnicityId: foreignKey.optional(),
  religionId: foreignKey.optional(),
  educationalLevel: z.enum(EDUCATIONAL_ATTAINMENT_TYPES).optional(),
  occupationId: foreignKey.optional(),
  socialMedia: z.enum(SOCIAL_MEDIA_TYPES).optional(),
  patientBillingTypeId: foreignKey.optional(),
  invoiceInsurancePlanId: foreignKey.array().optional(),
  motherId: foreignKey.optional(),
  fatherId: foreignKey.optional(),

  // Location Information (from GenericLocationFields)
  cityTown: stringWithMaxLength.optional(),
  streetVillage: stringWithMaxLength.optional(),
  countryId: foreignKey.optional(),
  divisionId: foreignKey.optional(),
  subdivisionId: foreignKey.optional(),
  settlementId: foreignKey.optional(),
  medicalAreaId: foreignKey.optional(),
  nursingZoneId: foreignKey.optional(),

  // Birth Details (from GenericBirthFields - only when patientRegistryType is 'birth_registry')
  timeOfBirth: datetimeCustomValidation.optional(),
  gestationalAgeEstimate: z.number().min(1).max(45).optional(),
  registeredBirthPlace: z.enum(PLACE_OF_BIRTH_TYPES).optional(),
  birthFacilityId: foreignKey.optional(),
  attendantAtBirth: z.enum(ATTENDANT_OF_BIRTH_TYPES).optional(),
  nameOfAttendantAtBirth: stringWithMaxLength.optional(),
  birthDeliveryType: z.enum(BIRTH_DELIVERY_TYPES).optional(),
  birthType: z.enum(BIRTH_TYPES).optional(),
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
