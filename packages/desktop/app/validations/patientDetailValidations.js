import * as yup from 'yup';
import { isEqual } from 'lodash';

import {
  BIRTH_DELIVERY_TYPES,
  BIRTH_TYPES,
  PLACE_OF_BIRTH_TYPES,
  PATIENT_REGISTRY_TYPES,
} from '@tamanu/constants';

const requiredWhenConfiguredMandatory = (getLocalisation, name, baseType) => {
  return baseType.when([], {
    is: () => !!getLocalisation(`fields.${name}.requiredPatientData`),
    then: baseType.required(`${getLocalisation(`fields.${name}.shortLabel`)} is required `),
    otherwise: baseType,
  });
};

const requiredBirthFieldWhenConfiguredMandatory = (
  getLocalisation,
  patientRegistryType,
  name,
  baseType,
) =>
  baseType.when([], {
    is: () => patientRegistryType === PATIENT_REGISTRY_TYPES.BIRTH_REGISTRY,
    then: requiredWhenConfiguredMandatory(getLocalisation, name, baseType),
    otherwise: baseType,
  });

export const getPatientDetailsValidation = (patientRegistryType, sexValues, getLocalisation) => {
  const patientDetailsValidationSchema = yup.object().shape({
    firstName: yup.string().required(),
    middleName: requiredWhenConfiguredMandatory(getLocalisation, 'middleName', yup.string()),
    lastName: yup.string().required(),
    culturalName: requiredWhenConfiguredMandatory(getLocalisation, 'culturalName', yup.string()),
    dateOfBirth: yup.date().required(),
    sex: yup
      .string()
      .oneOf(sexValues)
      .required(),
    email: requiredWhenConfiguredMandatory(getLocalisation, 'email', yup.string().email()),

    /* --- PATIENT BIRTH FIELDS START --- */
    birthFacilityId: requiredBirthFieldWhenConfiguredMandatory(
      getLocalisation,
      patientRegistryType,
      'birthFacilityId',
      yup.string().when('registeredBirthPlace', {
        is: value => value === PLACE_OF_BIRTH_TYPES.HEALTH_FACILITY,
        then: yup.string().required,
        otherwise: yup.string(),
      }),
    ),
    attendantAtBirth: requiredBirthFieldWhenConfiguredMandatory(
      getLocalisation,
      patientRegistryType,
      'attendantAtBirth',
      yup.string(),
    ),
    nameOfAttendantAtBirth: requiredBirthFieldWhenConfiguredMandatory(
      getLocalisation,
      patientRegistryType,
      'nameOfAttendantAtBirth',
      yup.string(),
    ),
    birthWeight: requiredBirthFieldWhenConfiguredMandatory(
      getLocalisation,
      patientRegistryType,
      'birthWeight',
      yup
        .number()
        .min(0)
        .max(6),
    ),
    birthLength: requiredBirthFieldWhenConfiguredMandatory(
      getLocalisation,
      patientRegistryType,
      'birthLength',
      yup
        .number()
        .min(0)
        .max(100),
    ),
    birthDeliveryType: requiredBirthFieldWhenConfiguredMandatory(
      getLocalisation,
      patientRegistryType,
      'birthDeliveryType',
      yup.string().oneOf(Object.values(BIRTH_DELIVERY_TYPES)),
    ),
    gestationalAgeEstimate: requiredBirthFieldWhenConfiguredMandatory(
      getLocalisation,
      patientRegistryType,
      'gestationalAgeEstimate',
      yup
        .number()
        .min(1)
        .max(45),
    ),
    apgarScoreOneMinute: requiredBirthFieldWhenConfiguredMandatory(
      getLocalisation,
      patientRegistryType,
      'apgarScoreOneMinute',
      yup
        .number()
        .min(1)
        .max(10),
    ),
    apgarScoreFiveMinutes: requiredBirthFieldWhenConfiguredMandatory(
      getLocalisation,
      patientRegistryType,
      'apgarScoreFiveMinutes',
      yup
        .number()
        .min(1)
        .max(10),
    ),
    apgarScoreTenMinutes: requiredBirthFieldWhenConfiguredMandatory(
      getLocalisation,
      patientRegistryType,
      'apgarScoreTenMinutes',
      yup
        .number()
        .min(1)
        .max(10),
    ),
    birthType: requiredBirthFieldWhenConfiguredMandatory(
      getLocalisation,
      patientRegistryType,
      'birthType',
      yup.string().oneOf(Object.values(BIRTH_TYPES)),
    ),
    timeOfBirth: requiredBirthFieldWhenConfiguredMandatory(
      getLocalisation,
      patientRegistryType,
      'timeOfBirth',
      yup.string(),
    ),
    registeredBirthPlace: requiredBirthFieldWhenConfiguredMandatory(
      getLocalisation,
      patientRegistryType,
      'registeredBirthPlace',
      yup.string().oneOf(Object.values(PLACE_OF_BIRTH_TYPES)),
    ),
    /* --- PATIENT BIRTH FIELDS END--- */

    religionId: requiredWhenConfiguredMandatory(getLocalisation, 'religionId', yup.string()),
    birthCertificate: requiredWhenConfiguredMandatory(
      getLocalisation,
      'birthCertificate',
      yup.string(),
    ),
    passport: requiredWhenConfiguredMandatory(getLocalisation, 'passport', yup.string()),
    primaryContactNumber: requiredWhenConfiguredMandatory(
      getLocalisation,
      'primaryContactNumber',
      yup.number(),
    ),
    secondaryContactNumber: requiredWhenConfiguredMandatory(
      getLocalisation,
      'secondaryContactNumber',
      yup.number(),
    ),
    emergencyContactName: requiredWhenConfiguredMandatory(
      getLocalisation,
      'emergencyContactName',
      yup.string(),
    ),
    emergencyContactNumber: requiredWhenConfiguredMandatory(
      getLocalisation,
      'emergencyContactNumber',
      yup.number(),
    ),
    title: requiredWhenConfiguredMandatory(getLocalisation, 'title', yup.string()),
    bloodType: requiredWhenConfiguredMandatory(getLocalisation, 'bloodType', yup.string()),
    placeOfBirth: requiredWhenConfiguredMandatory(getLocalisation, 'placeOfBirth', yup.string()),
    countryOfBirthId: requiredWhenConfiguredMandatory(
      getLocalisation,
      'countryOfBirthId',
      yup.string(),
    ),
    nationalityId: requiredWhenConfiguredMandatory(getLocalisation, 'nationalityId', yup.string()),
    ethnicityId: requiredWhenConfiguredMandatory(getLocalisation, 'ethnicityId', yup.string()),
    patientBillingTypeId: requiredWhenConfiguredMandatory(
      getLocalisation,
      'patientBillingTypeId',
      yup.string(),
    ),
    motherId: requiredWhenConfiguredMandatory(getLocalisation, 'motherId', yup.string()),
    fatherId: requiredWhenConfiguredMandatory(getLocalisation, 'fatherId', yup.string()),
    subdivisionId: requiredWhenConfiguredMandatory(getLocalisation, 'subdivisionId', yup.string()),
    divisionId: requiredWhenConfiguredMandatory(getLocalisation, 'divisionId', yup.string()),
    countryId: requiredWhenConfiguredMandatory(getLocalisation, 'countryId', yup.string()),
    settlementId: requiredWhenConfiguredMandatory(getLocalisation, 'settlementId', yup.string()),
    medicalAreaId: requiredWhenConfiguredMandatory(getLocalisation, 'medicalAreaId', yup.string()),
    nursingZoneId: requiredWhenConfiguredMandatory(getLocalisation, 'nursingZoneId', yup.string()),
    streetVillage: requiredWhenConfiguredMandatory(getLocalisation, 'streetVillage', yup.string()),
    cityTown: requiredWhenConfiguredMandatory(getLocalisation, 'cityTown', yup.string()),
    drivingLicense: yup.string().when({
      is: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT,
      then: requiredWhenConfiguredMandatory(getLocalisation, 'drivingLicense', yup.string()),
      otherwise: yup.string(),
    }),
    maritalStatus: yup.string().when({
      is: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT,
      then: requiredWhenConfiguredMandatory(getLocalisation, 'maritalStatus', yup.string()),
      otherwise: yup.string(),
    }),
    occupationId: yup.string().when({
      is: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT,
      then: requiredWhenConfiguredMandatory(getLocalisation, 'occupationId', yup.string()),
      otherwise: yup.string(),
    }),
    educationalLevel: yup.string().when({
      is: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT,
      then: requiredWhenConfiguredMandatory(getLocalisation, 'educationalLevel', yup.string()),
      otherwise: yup.string(),
    }),
    socialMedia: yup.string().when({
      is: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT,
      then: requiredWhenConfiguredMandatory(getLocalisation, 'socialMedia', yup.string()),
      otherwise: yup.string(),
    }),
  });

  const validatedProperties = Object.keys(patientDetailsValidationSchema.describe().fields);
  const localisedFields = getLocalisation('fields');
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
