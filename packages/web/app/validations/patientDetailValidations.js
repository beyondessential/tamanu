import * as yup from 'yup';
import { isEqual } from 'lodash';

import {
  BIRTH_DELIVERY_TYPES,
  BIRTH_TYPES,
  PATIENT_REGISTRY_TYPES,
  PLACE_OF_BIRTH_TYPES,
} from '@tamanu/constants';

const requiredWhenConfiguredMandatory = (getLocalisation, getTranslation, name, baseType) => {
  console.log(baseType);
  return baseType.when([], {
    is: () => !!getLocalisation(`fields.${name}.requiredPatientData`),
    then: baseType.required(
      // TODO: this is terrible but not sure what alternative is
      `${getTranslation(
        `general.localisedField.${name}.label.short`,
        getLocalisation(`fields.${name}.shortLabel`),
      )} is required `,
    ),
    otherwise: baseType,
  });
};

const requiredBirthFieldWhenConfiguredMandatory = (
  getLocalisation,
  getTranslation,
  patientRegistryType,
  name,
  baseType,
) =>
  baseType.when([], {
    is: () => patientRegistryType === PATIENT_REGISTRY_TYPES.BIRTH_REGISTRY,
    then: requiredWhenConfiguredMandatory(getLocalisation, getTranslation, name, baseType),
    otherwise: baseType,
  });

export const getPatientDetailsValidation = (
  patientRegistryType,
  sexValues,
  getLocalisation,
  getTranslation,
) => {
  const patientDetailsValidationSchema = yup.object().shape({
    firstName: yup.string().required(),
    middleName: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'middleName',
      yup.string(),
    ),
    lastName: yup.string().required(),
    culturalName: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'culturalName',
      yup.string(),
    ),
    dateOfBirth: yup.date().required(),
    sex: yup
      .string()
      .oneOf(sexValues)
      .required(),
    email: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'email',
      yup.string().email(),
    ),

    /* --- PATIENT BIRTH FIELDS START --- */
    birthFacilityId: yup.string().when('registeredBirthPlace', {
      is: value => value === PLACE_OF_BIRTH_TYPES.HEALTH_FACILITY,
      then: requiredBirthFieldWhenConfiguredMandatory(
        getLocalisation,
        getTranslation,
        patientRegistryType,
        'birthFacilityId',
        yup.string(),
      ),
      otherwise: yup.string(),
    }),

    attendantAtBirth: requiredBirthFieldWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      patientRegistryType,
      'attendantAtBirth',
      yup.string(),
    ),
    nameOfAttendantAtBirth: requiredBirthFieldWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      patientRegistryType,
      'nameOfAttendantAtBirth',
      yup.string(),
    ),
    birthWeight: requiredBirthFieldWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      patientRegistryType,
      'birthWeight',
      yup
        .number()
        .min(0)
        .max(6),
    ),
    birthLength: requiredBirthFieldWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      patientRegistryType,
      'birthLength',
      yup
        .number()
        .min(0)
        .max(100),
    ),
    birthDeliveryType: requiredBirthFieldWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      patientRegistryType,
      'birthDeliveryType',
      yup.string().oneOf(Object.values(BIRTH_DELIVERY_TYPES)),
    ),
    gestationalAgeEstimate: requiredBirthFieldWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      patientRegistryType,
      'gestationalAgeEstimate',
      yup
        .number()
        .min(1)
        .max(45),
    ),
    apgarScoreOneMinute: requiredBirthFieldWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      patientRegistryType,
      'apgarScoreOneMinute',
      yup
        .number()
        .min(1)
        .max(10),
    ),
    apgarScoreFiveMinutes: requiredBirthFieldWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      patientRegistryType,
      'apgarScoreFiveMinutes',
      yup
        .number()
        .min(1)
        .max(10),
    ),
    apgarScoreTenMinutes: requiredBirthFieldWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      patientRegistryType,
      'apgarScoreTenMinutes',
      yup
        .number()
        .min(1)
        .max(10),
    ),
    birthType: requiredBirthFieldWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      patientRegistryType,
      'birthType',
      yup.string().oneOf(Object.values(BIRTH_TYPES)),
    ),
    timeOfBirth: requiredBirthFieldWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      patientRegistryType,
      'timeOfBirth',
      yup.string(),
    ),
    registeredBirthPlace: requiredBirthFieldWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      patientRegistryType,
      'registeredBirthPlace',
      yup.string().oneOf(Object.values(PLACE_OF_BIRTH_TYPES)),
    ),
    /* --- PATIENT BIRTH FIELDS END--- */

    religionId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'religionId',
      yup.string(),
    ),
    birthCertificate: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'birthCertificate',
      yup.string(),
    ),
    passport: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'passport',
      yup.string(),
    ),
    primaryContactNumber: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'primaryContactNumber',
      yup.number(),
    ),
    secondaryContactNumber: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'secondaryContactNumber',
      yup.number(),
    ),
    emergencyContactName: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'emergencyContactName',
      yup.string(),
    ),
    emergencyContactNumber: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'emergencyContactNumber',
      yup.number(),
    ),
    title: requiredWhenConfiguredMandatory(getLocalisation, getTranslation, 'title', yup.string()),
    bloodType: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'bloodType',
      yup.string(),
    ),
    placeOfBirth: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'placeOfBirth',
      yup.string(),
    ),
    countryOfBirthId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'countryOfBirthId',
      yup.string(),
    ),
    nationalityId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'nationalityId',
      yup.string(),
    ),
    ethnicityId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'ethnicityId',
      yup.string(),
    ),
    patientBillingTypeId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'patientBillingTypeId',
      yup.string(),
    ),
    motherId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'motherId',
      yup.string(),
    ),
    fatherId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'fatherId',
      yup.string(),
    ),
    subdivisionId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'subdivisionId',
      yup.string(),
    ),
    divisionId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'divisionId',
      yup.string(),
    ),
    countryId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'countryId',
      yup.string(),
    ),
    settlementId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'settlementId',
      yup.string(),
    ),
    medicalAreaId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'medicalAreaId',
      yup.string(),
    ),
    nursingZoneId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'nursingZoneId',
      yup.string(),
    ),
    streetVillage: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'streetVillage',
      yup.string(),
    ),
    villageId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'villageId',
      yup.string(),
    ),
    cityTown: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'cityTown',
      yup.string(),
    ),
    drivingLicense: yup.string().when({
      is: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT,
      then: requiredWhenConfiguredMandatory(
        getLocalisation,
        getTranslation,
        'drivingLicense',
        yup.string(),
      ),
      otherwise: yup.string(),
    }),
    maritalStatus: yup.string().when({
      is: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT,
      then: requiredWhenConfiguredMandatory(
        getLocalisation,
        getTranslation,
        'maritalStatus',
        yup.string(),
      ),
      otherwise: yup.string(),
    }),
    occupationId: yup.string().when({
      is: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT,
      then: requiredWhenConfiguredMandatory(
        getLocalisation,
        getTranslation,
        'occupationId',
        yup.string(),
      ),
      otherwise: yup.string(),
    }),
    educationalLevel: yup.string().when({
      is: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT,
      then: requiredWhenConfiguredMandatory(
        getLocalisation,
        getTranslation,
        'educationalLevel',
        yup.string(),
      ),
      otherwise: yup.string(),
    }),
    socialMedia: yup.string().when({
      is: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT,
      then: requiredWhenConfiguredMandatory(
        getLocalisation,
        getTranslation,
        'socialMedia',
        yup.string(),
      ),
      otherwise: yup.string(),
    }),
  });

  const validatedProperties = Object.keys(patientDetailsValidationSchema.describe().fields);
  const localisedFields = getLocalisation('fields');
  const localisedPatientFields = Object.keys(localisedFields).filter(fieldName =>
    Object.prototype.hasOwnProperty.call(localisedFields[fieldName], 'requiredPatientData'),
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
