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

export const foreignKeySchema = z.string().describe('__foreignKey__');

export const createPatientSchema = z.object({
  // Required fields for patient creation
  patientRegistryType: z.enum([
    PATIENT_REGISTRY_TYPES.NEW_PATIENT,
    PATIENT_REGISTRY_TYPES.BIRTH_REGISTRY,
  ]),
  facilityId: foreignKeySchema,

  // Primary Details (from GenericPrimaryDetailsLayout)
  displayId: z.string().optional(),
  firstName: z.string().optional(),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
  culturalName: z.string().optional(),
  email: z.string().email().optional(),
  dateOfBirth: z.string().optional(), // ISO date string
  sex: z.enum([SEX_VALUES.MALE, SEX_VALUES.FEMALE, SEX_VALUES.OTHER]),
  villageId: foreignKeySchema.optional(),

  // Identification Information (from GenericIdentificationFields)
  birthCertificate: z.string().optional(),
  drivingLicense: z.string().optional(),
  passport: z.string().optional(),
  insurerId: foreignKeySchema.optional(),
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
  maritalStatus: z
    .enum([
      MARTIAL_STATUS_VALUES.DEFACTO,
      MARTIAL_STATUS_VALUES.MARRIED,
      MARTIAL_STATUS_VALUES.SINGLE,
      MARTIAL_STATUS_VALUES.WIDOW,
      MARTIAL_STATUS_VALUES.DIVORCED,
      MARTIAL_STATUS_VALUES.SEPARATED,
      MARTIAL_STATUS_VALUES.UNKNOWN,
    ])
    .optional(),
  bloodType: z
    .enum([
      BLOOD_TYPES.A_POSITIVE,
      BLOOD_TYPES.A_NEGATIVE,
      BLOOD_TYPES.AB_NEGATIVE,
      BLOOD_TYPES.AB_POSITIVE,
      BLOOD_TYPES.B_POSITIVE,
      BLOOD_TYPES.B_NEGATIVE,
      BLOOD_TYPES.O_POSITIVE,
      BLOOD_TYPES.O_NEGATIVE,
    ])
    .optional(),
  placeOfBirth: z.string().optional(),
  countryOfBirthId: foreignKeySchema.optional(),
  nationalityId: foreignKeySchema.optional(),
  ethnicityId: foreignKeySchema.optional(),
  religionId: foreignKeySchema.optional(),
  educationalLevel: z
    .enum([
      EDUCATIONAL_ATTAINMENT_TYPES.NO_FORMAL_SCHOOLING,
      EDUCATIONAL_ATTAINMENT_TYPES.LESS_THAN_PRIMARY_SCHOOL,
      EDUCATIONAL_ATTAINMENT_TYPES.PRIMARY_SCHOOL_COMPLETED,
      EDUCATIONAL_ATTAINMENT_TYPES.SEC_SCHOOL_COMPLETED,
      EDUCATIONAL_ATTAINMENT_TYPES.HIGH_SCHOOL_COMPLETED,
      EDUCATIONAL_ATTAINMENT_TYPES.UNIVERSITY_COMPLETED,
      EDUCATIONAL_ATTAINMENT_TYPES.POST_GRAD_COMPLETED,
    ])
    .optional(),
  occupationId: foreignKeySchema.optional(),
  socialMedia: z
    .enum([
      SOCIAL_MEDIA_TYPES.FACEBOOK,
      SOCIAL_MEDIA_TYPES.TWITTER,
      SOCIAL_MEDIA_TYPES.INSTAGRAM,
      SOCIAL_MEDIA_TYPES.LINKEDIN,
      SOCIAL_MEDIA_TYPES.VIBER,
      SOCIAL_MEDIA_TYPES.WHATSAPP,
    ])
    .optional(),
  patientBillingTypeId: foreignKeySchema.optional(),
  motherId: foreignKeySchema.optional(),
  fatherId: foreignKeySchema.optional(),

  // Location Information (from GenericLocationFields)
  cityTown: z.string().optional(),
  streetVillage: z.string().optional(),
  countryId: foreignKeySchema.optional(),
  divisionId: foreignKeySchema.optional(),
  subdivisionId: foreignKeySchema.optional(),
  settlementId: foreignKeySchema.optional(),
  medicalAreaId: foreignKeySchema.optional(),
  nursingZoneId: foreignKeySchema.optional(),

  // Birth Details (from GenericBirthFields - only when patientRegistryType is 'birth_registry')
  timeOfBirth: z.string().optional(), // ISO datetime string
  gestationalAgeEstimate: z.number().optional(),
  registeredBirthPlace: z
    .enum([
      PLACE_OF_BIRTH_TYPES.HEALTH_FACILITY,
      PLACE_OF_BIRTH_TYPES.HOME,
      PLACE_OF_BIRTH_TYPES.OTHER,
    ])
    .optional(),
  birthFacilityId: foreignKeySchema.nullable().optional(),
  attendantAtBirth: z
    .enum([
      ATTENDANT_OF_BIRTH_TYPES.DOCTOR,
      ATTENDANT_OF_BIRTH_TYPES.NURSE,
      ATTENDANT_OF_BIRTH_TYPES.MIDWIFE,
      ATTENDANT_OF_BIRTH_TYPES.TRADITIONAL_BIRTH_ATTENDANT,
      ATTENDANT_OF_BIRTH_TYPES.OTHER,
    ])
    .optional(),
  nameOfAttendantAtBirth: z.string().optional(),
  birthDeliveryType: z
    .enum([
      BIRTH_DELIVERY_TYPES.NORMAL_VAGINAL_DELIVERY,
      BIRTH_DELIVERY_TYPES.BREECH,
      BIRTH_DELIVERY_TYPES.EMERGENCY_C_SECTION,
      BIRTH_DELIVERY_TYPES.ELECTIVE_C_SECTION,
      BIRTH_DELIVERY_TYPES.VACUUM_EXTRACTION,
      BIRTH_DELIVERY_TYPES.FORCEPS,
      BIRTH_DELIVERY_TYPES.OTHER,
    ])
    .optional(),
  birthType: z.enum([BIRTH_TYPES.SINGLE, BIRTH_TYPES.PLURAL]).optional(),
  birthWeight: z.number().optional(),
  birthLength: z.number().optional(),
  apgarScoreOneMinute: z.number().int().min(0).max(10).optional(),
  apgarScoreFiveMinutes: z.number().int().min(0).max(10).optional(),
  apgarScoreTenMinutes: z.number().int().min(0).max(10).optional(),

  // Custom patient fields (dynamic field definitions)
  patientFields: z.record(z.string(), z.string()).optional(),

  // Backend-added fields (not from frontend form)
  registeredById: foreignKeySchema,
});

// Schema for updating patients (all fields optional)
export const updatePatientSchema = createPatientSchema.partial().omit({
  patientRegistryType: true, // Not needed for updates
});
