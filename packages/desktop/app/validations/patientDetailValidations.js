import * as yup from 'yup';
import { isEqual } from 'lodash';

import {
  BIRTH_DELIVERY_TYPES,
  BIRTH_TYPES,
  PLACE_OF_BIRTH_TYPES,
  PATIENT_REGISTRY_TYPES,
} from '@tamanu/constants';

const requiredWhenConfiguredMandatory = (getSetting, name, baseType) => {
  return baseType.when([], {
    is: () => !!getSetting(`localisation.fields.${name}.requiredPatientData`),
    then: baseType.required(`${getSetting(`localisation.fields.${name}.shortLabel`)} is required `),
    otherwise: baseType,
  });
};

const requiredBirthFieldWhenConfiguredMandatory = (
  getSetting,
  patientRegistryType,
  name,
  baseType,
) =>
  baseType.when([], {
    is: () => patientRegistryType === PATIENT_REGISTRY_TYPES.BIRTH_REGISTRY,
    then: requiredWhenConfiguredMandatory(getSetting, name, baseType),
    otherwise: baseType,
  });

export const getPatientDetailsValidation = (patientRegistryType, sexValues, getSetting) => {
  const patientDetailsValidationSchema = yup.object().shape({
    firstName: yup.string().required(),
    middleName: requiredWhenConfiguredMandatory(getSetting, 'middleName', yup.string()),
    lastName: yup.string().required(),
    culturalName: requiredWhenConfiguredMandatory(getSetting, 'culturalName', yup.string()),
    dateOfBirth: yup.date().required(),
    sex: yup
      .string()
      .oneOf(sexValues)
      .required(),
    email: requiredWhenConfiguredMandatory(getSetting, 'email', yup.string().email()),

    /* --- PATIENT BIRTH FIELDS START --- */
    birthFacilityId: yup.string().when('registeredBirthPlace', {
      is: value => value === PLACE_OF_BIRTH_TYPES.HEALTH_FACILITY,
      then: requiredBirthFieldWhenConfiguredMandatory(
        getSetting,
        patientRegistryType,
        'birthFacilityId',
        yup.string(),
      ),
      otherwise: yup.string(),
    }),

    attendantAtBirth: requiredBirthFieldWhenConfiguredMandatory(
      getSetting,
      patientRegistryType,
      'attendantAtBirth',
      yup.string(),
    ),
    nameOfAttendantAtBirth: requiredBirthFieldWhenConfiguredMandatory(
      getSetting,
      patientRegistryType,
      'nameOfAttendantAtBirth',
      yup.string(),
    ),
    birthWeight: requiredBirthFieldWhenConfiguredMandatory(
      getSetting,
      patientRegistryType,
      'birthWeight',
      yup
        .number()
        .min(0)
        .max(6),
    ),
    birthLength: requiredBirthFieldWhenConfiguredMandatory(
      getSetting,
      patientRegistryType,
      'birthLength',
      yup
        .number()
        .min(0)
        .max(100),
    ),
    birthDeliveryType: requiredBirthFieldWhenConfiguredMandatory(
      getSetting,
      patientRegistryType,
      'birthDeliveryType',
      yup.string().oneOf(Object.values(BIRTH_DELIVERY_TYPES)),
    ),
    gestationalAgeEstimate: requiredBirthFieldWhenConfiguredMandatory(
      getSetting,
      patientRegistryType,
      'gestationalAgeEstimate',
      yup
        .number()
        .min(1)
        .max(45),
    ),
    apgarScoreOneMinute: requiredBirthFieldWhenConfiguredMandatory(
      getSetting,
      patientRegistryType,
      'apgarScoreOneMinute',
      yup
        .number()
        .min(1)
        .max(10),
    ),
    apgarScoreFiveMinutes: requiredBirthFieldWhenConfiguredMandatory(
      getSetting,
      patientRegistryType,
      'apgarScoreFiveMinutes',
      yup
        .number()
        .min(1)
        .max(10),
    ),
    apgarScoreTenMinutes: requiredBirthFieldWhenConfiguredMandatory(
      getSetting,
      patientRegistryType,
      'apgarScoreTenMinutes',
      yup
        .number()
        .min(1)
        .max(10),
    ),
    birthType: requiredBirthFieldWhenConfiguredMandatory(
      getSetting,
      patientRegistryType,
      'birthType',
      yup.string().oneOf(Object.values(BIRTH_TYPES)),
    ),
    timeOfBirth: requiredBirthFieldWhenConfiguredMandatory(
      getSetting,
      patientRegistryType,
      'timeOfBirth',
      yup.string(),
    ),
    registeredBirthPlace: requiredBirthFieldWhenConfiguredMandatory(
      getSetting,
      patientRegistryType,
      'registeredBirthPlace',
      yup.string().oneOf(Object.values(PLACE_OF_BIRTH_TYPES)),
    ),
    /* --- PATIENT BIRTH FIELDS END--- */

    religionId: requiredWhenConfiguredMandatory(getSetting, 'religionId', yup.string()),
    birthCertificate: requiredWhenConfiguredMandatory(getSetting, 'birthCertificate', yup.string()),
    passport: requiredWhenConfiguredMandatory(getSetting, 'passport', yup.string()),
    primaryContactNumber: requiredWhenConfiguredMandatory(
      getSetting,
      'primaryContactNumber',
      yup.number(),
    ),
    secondaryContactNumber: requiredWhenConfiguredMandatory(
      getSetting,
      'secondaryContactNumber',
      yup.number(),
    ),
    emergencyContactName: requiredWhenConfiguredMandatory(
      getSetting,
      'emergencyContactName',
      yup.string(),
    ),
    emergencyContactNumber: requiredWhenConfiguredMandatory(
      getSetting,
      'emergencyContactNumber',
      yup.number(),
    ),
    title: requiredWhenConfiguredMandatory(getSetting, 'title', yup.string()),
    bloodType: requiredWhenConfiguredMandatory(getSetting, 'bloodType', yup.string()),
    placeOfBirth: requiredWhenConfiguredMandatory(getSetting, 'placeOfBirth', yup.string()),
    countryOfBirthId: requiredWhenConfiguredMandatory(getSetting, 'countryOfBirthId', yup.string()),
    nationalityId: requiredWhenConfiguredMandatory(getSetting, 'nationalityId', yup.string()),
    ethnicityId: requiredWhenConfiguredMandatory(getSetting, 'ethnicityId', yup.string()),
    patientBillingTypeId: requiredWhenConfiguredMandatory(
      getSetting,
      'patientBillingTypeId',
      yup.string(),
    ),
    motherId: requiredWhenConfiguredMandatory(getSetting, 'motherId', yup.string()),
    fatherId: requiredWhenConfiguredMandatory(getSetting, 'fatherId', yup.string()),
    subdivisionId: requiredWhenConfiguredMandatory(getSetting, 'subdivisionId', yup.string()),
    divisionId: requiredWhenConfiguredMandatory(getSetting, 'divisionId', yup.string()),
    countryId: requiredWhenConfiguredMandatory(getSetting, 'countryId', yup.string()),
    settlementId: requiredWhenConfiguredMandatory(getSetting, 'settlementId', yup.string()),
    medicalAreaId: requiredWhenConfiguredMandatory(getSetting, 'medicalAreaId', yup.string()),
    nursingZoneId: requiredWhenConfiguredMandatory(getSetting, 'nursingZoneId', yup.string()),
    streetVillage: requiredWhenConfiguredMandatory(getSetting, 'streetVillage', yup.string()),
    cityTown: requiredWhenConfiguredMandatory(getSetting, 'cityTown', yup.string()),
    drivingLicense: yup.string().when({
      is: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT,
      then: requiredWhenConfiguredMandatory(getSetting, 'drivingLicense', yup.string()),
      otherwise: yup.string(),
    }),
    maritalStatus: yup.string().when({
      is: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT,
      then: requiredWhenConfiguredMandatory(getSetting, 'maritalStatus', yup.string()),
      otherwise: yup.string(),
    }),
    occupationId: yup.string().when({
      is: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT,
      then: requiredWhenConfiguredMandatory(getSetting, 'occupationId', yup.string()),
      otherwise: yup.string(),
    }),
    educationalLevel: yup.string().when({
      is: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT,
      then: requiredWhenConfiguredMandatory(getSetting, 'educationalLevel', yup.string()),
      otherwise: yup.string(),
    }),
    socialMedia: yup.string().when({
      is: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT,
      then: requiredWhenConfiguredMandatory(getSetting, 'socialMedia', yup.string()),
      otherwise: yup.string(),
    }),
  });

  const validatedProperties = Object.keys(patientDetailsValidationSchema.describe().fields);
  const localisedFields = getSetting('localisation.fields');
  const localisedPatientFields = Object.keys(localisedFields).filter(fieldName =>
    localisedFields[fieldName].hasOwnProperty('requiredPatientData'),
  );

  // Validate if any localised patient fields are missing schema validation,
  // so that we don't miss mandatory validation for any patient fields
  if (!isEqual(validatedProperties.sort(), localisedPatientFields.sort())) {
    const differences = localisedPatientFields.filter(item => !validatedProperties.includes(item));

    throw new Error(
      `Missing schema validation for these following localised patient fields: ${differences.toString()}`,
    );
  }

  return patientDetailsValidationSchema;
};
