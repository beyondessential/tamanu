import { z } from 'zod';
import { faker } from '@faker-js/faker';
import { generateMock } from '@anatine/zod-mock';
import { createPatientSchema } from '@tamanu/facility-server/schemas/patient';
// import {
//   PATIENT_REGISTRY_TYPES,
//   SEX_VALUES,
//   BLOOD_TYPES,
//   MARTIAL_STATUS_VALUES,
//   TITLES,
//   EDUCATIONAL_ATTAINMENT_TYPES,
//   SOCIAL_MEDIA_TYPES,
//   ATTENDANT_OF_BIRTH_TYPES,
//   BIRTH_DELIVERY_TYPES,
//   PLACE_OF_BIRTH_TYPES,
//   BIRTH_TYPES,
// } from '@tamanu/constants';

// Custom mock generator that handles date fields and enums properly
// const generateCustomPatientMock = () => {
//   const baseMock = generateMock(createPatientSchema, {
//     stringMap: {
//       dateOfBirth: () => faker.date.birthdate().toISOString().split('T')[0], // YYYY-MM-DD format
//       timeOfBirth: () => faker.date.recent().toISOString(), // Full ISO datetime string
//     },
//   });

//   return {
//     ...baseMock,
//     // Override date fields with proper ISO date strings
//     dateOfBirth: faker.date.birthdate().toISOString().split('T')[0], // YYYY-MM-DD format
//     timeOfBirth: faker.date.recent().toISOString(), // Full ISO datetime string

//     // Override enum fields with valid values
//     patientRegistryType: faker.helpers.arrayElement([
//       PATIENT_REGISTRY_TYPES.NEW_PATIENT,
//       PATIENT_REGISTRY_TYPES.BIRTH_REGISTRY,
//     ]),
//     sex: faker.helpers.arrayElement([SEX_VALUES.MALE, SEX_VALUES.FEMALE, SEX_VALUES.OTHER]),
//     title: faker.helpers.arrayElement([
//       TITLES.MR,
//       TITLES.MRS,
//       TITLES.MS,
//       TITLES.MISS,
//       TITLES.DR,
//       TITLES.SR,
//       TITLES.SN,
//     ]),
//     maritalStatus: faker.helpers.arrayElement([
//       MARTIAL_STATUS_VALUES.DEFACTO,
//       MARTIAL_STATUS_VALUES.MARRIED,
//       MARTIAL_STATUS_VALUES.SINGLE,
//       MARTIAL_STATUS_VALUES.WIDOW,
//       MARTIAL_STATUS_VALUES.DIVORCED,
//       MARTIAL_STATUS_VALUES.SEPARATED,
//       MARTIAL_STATUS_VALUES.UNKNOWN,
//     ]),
//     bloodType: faker.helpers.arrayElement([
//       BLOOD_TYPES.A_POSITIVE,
//       BLOOD_TYPES.A_NEGATIVE,
//       BLOOD_TYPES.AB_NEGATIVE,
//       BLOOD_TYPES.AB_POSITIVE,
//       BLOOD_TYPES.B_POSITIVE,
//       BLOOD_TYPES.B_NEGATIVE,
//       BLOOD_TYPES.O_POSITIVE,
//       BLOOD_TYPES.O_NEGATIVE,
//     ]),
//     educationalLevel: faker.helpers.arrayElement([
//       EDUCATIONAL_ATTAINMENT_TYPES.NO_FORMAL_SCHOOLING,
//       EDUCATIONAL_ATTAINMENT_TYPES.LESS_THAN_PRIMARY_SCHOOL,
//       EDUCATIONAL_ATTAINMENT_TYPES.PRIMARY_SCHOOL_COMPLETED,
//       EDUCATIONAL_ATTAINMENT_TYPES.SEC_SCHOOL_COMPLETED,
//       EDUCATIONAL_ATTAINMENT_TYPES.HIGH_SCHOOL_COMPLETED,
//       EDUCATIONAL_ATTAINMENT_TYPES.UNIVERSITY_COMPLETED,
//       EDUCATIONAL_ATTAINMENT_TYPES.POST_GRAD_COMPLETED,
//     ]),
//     socialMedia: faker.helpers.arrayElement([
//       SOCIAL_MEDIA_TYPES.FACEBOOK,
//       SOCIAL_MEDIA_TYPES.TWITTER,
//       SOCIAL_MEDIA_TYPES.INSTAGRAM,
//       SOCIAL_MEDIA_TYPES.LINKEDIN,
//       SOCIAL_MEDIA_TYPES.VIBER,
//       SOCIAL_MEDIA_TYPES.WHATSAPP,
//     ]),
//     registeredBirthPlace: faker.helpers.arrayElement([
//       PLACE_OF_BIRTH_TYPES.HEALTH_FACILITY,
//       PLACE_OF_BIRTH_TYPES.HOME,
//       PLACE_OF_BIRTH_TYPES.OTHER,
//     ]),
//     attendantAtBirth: faker.helpers.arrayElement([
//       ATTENDANT_OF_BIRTH_TYPES.DOCTOR,
//       ATTENDANT_OF_BIRTH_TYPES.NURSE,
//       ATTENDANT_OF_BIRTH_TYPES.MIDWIFE,
//       ATTENDANT_OF_BIRTH_TYPES.TRADITIONAL_BIRTH_ATTENDANT,
//       ATTENDANT_OF_BIRTH_TYPES.OTHER,
//     ]),
//     birthDeliveryType: faker.helpers.arrayElement([
//       BIRTH_DELIVERY_TYPES.NORMAL_VAGINAL_DELIVERY,
//       BIRTH_DELIVERY_TYPES.BREECH,
//       BIRTH_DELIVERY_TYPES.EMERGENCY_C_SECTION,
//       BIRTH_DELIVERY_TYPES.ELECTIVE_C_SECTION,
//       BIRTH_DELIVERY_TYPES.VACUUM_EXTRACTION,
//       BIRTH_DELIVERY_TYPES.FORCEPS,
//       BIRTH_DELIVERY_TYPES.OTHER,
//     ]),
//     birthType: faker.helpers.arrayElement([BIRTH_TYPES.SINGLE, BIRTH_TYPES.PLURAL]),

//     // Override numeric fields with proper numbers
//     gestationalAgeEstimate: faker.number.int({ min: 20, max: 42 }),
//     birthWeight: faker.number.float({ min: 1.5, max: 4.5, fractionDigits: 2 }),
//     birthLength: faker.number.float({ min: 30, max: 60, fractionDigits: 1 }),
//     apgarScoreOneMinute: faker.number.int({ min: 0, max: 10 }),
//     apgarScoreFiveMinutes: faker.number.int({ min: 0, max: 10 }),
//     apgarScoreTenMinutes: faker.number.int({ min: 0, max: 10 }),
//   };
// };

const generateNHN = () => {
  const letters = faker.string.alpha({ length: 4, casing: 'upper' });
  const numbers = faker.string.numeric(6);
  const generatedId = `${letters}${numbers}`;

  return generatedId;
};

const generateDisplayId = () => {
  const letters = faker.string.alpha({ length: 4, casing: 'upper' });
  const numbers = faker.string.numeric(6);
  const generatedId = `${letters}${numbers}`;

  return generatedId;
};

const overrideForeignKeys = (schemaShape: z.ZodRawShape, mock: Record<string, any>) => {
  for (const key in schemaShape) {
    const schema = schemaShape[key];
    if (typeof schema.description === 'string' && schema.description.includes('__foreignKey__')) {
      mock[key] = undefined;
    }
  }
  return mock;
};

export const fakePatientRequestBody = (
  overrides?: Partial<z.infer<typeof createPatientSchema>>,
) => {
  const schemaShape = createPatientSchema.shape;

  const mock = generateMock(createPatientSchema, {
    stringMap: {
      dateOfBirth: () => faker.date.birthdate().toISOString().split('T')[0], // YYYY-MM-DD format
      timeOfBirth: () => faker.date.recent().toISOString(), // Full ISO datetime string
      NHN: () => generateNHN(),
      displayId: () => generateDisplayId(),
    },
  });

  mock.patientFields = {};

  const final = { ...overrideForeignKeys(schemaShape, mock), ...overrides };

  return final;
};
