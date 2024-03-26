import * as yup from 'yup';
import { isEqual } from 'lodash';

import {
  BIRTH_DELIVERY_TYPES,
  BIRTH_TYPES,
  PATIENT_REGISTRY_TYPES,
  PLACE_OF_BIRTH_TYPES,
} from '@tamanu/constants';

const requiredWhenConfiguredMandatory = (
  getLocalisation,
  getTranslation,
  name,
  baseType,
  fallbackLabel, // this fallback label is a bit of a temporary workaround for now. Once the yup validation card is merged, validation text will all be handled through that work
) => {
  return baseType.when([], {
    is: () => !!getLocalisation(`fields.${name}.requiredPatientData`),
    then: baseType.required(
      `${getTranslation(`general.localisedField.${name}.label.short`, fallbackLabel)} is required `,
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
  fallbackLabel,
) =>
  baseType.when([], {
    is: () => patientRegistryType === PATIENT_REGISTRY_TYPES.BIRTH_REGISTRY,
    then: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      name,
      baseType,
      fallbackLabel,
    ),
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
      'Middle name',
    ),
    lastName: yup.string().required(),
    culturalName: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'culturalName',
      yup.string(),
      'Cultural name',
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
      'Email',
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
        'Name of health facility (if applicable)',
      ),
      otherwise: yup.string(),
    }),

    attendantAtBirth: requiredBirthFieldWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      patientRegistryType,
      'attendantAtBirth',
      yup.string(),
      'Attendant at birth',
    ),
    nameOfAttendantAtBirth: requiredBirthFieldWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      patientRegistryType,
      'nameOfAttendantAtBirth',
      yup.string(),
      'Name of attendant',
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
      'Birth weight (kg)',
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
      'Birth length (cm)',
    ),
    birthDeliveryType: requiredBirthFieldWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      patientRegistryType,
      'birthDeliveryType',
      yup.string().oneOf(Object.values(BIRTH_DELIVERY_TYPES)),
      'Delivery type',
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
      'Gestational age (weeks)',
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
      'Apgar score at 1 min',
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
      'Apgar score at 5 min',
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
      'Apgar score at 10 min',
    ),
    birthType: requiredBirthFieldWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      patientRegistryType,
      'birthType',
      yup.string().oneOf(Object.values(BIRTH_TYPES)),
      'Single/Plural birth',
    ),
    timeOfBirth: requiredBirthFieldWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      patientRegistryType,
      'timeOfBirth',
      yup.string(),
      'Time of birth',
    ),
    registeredBirthPlace: requiredBirthFieldWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      patientRegistryType,
      'registeredBirthPlace',
      yup.string().oneOf(Object.values(PLACE_OF_BIRTH_TYPES)),
      'Place of birth',
    ),
    /* --- PATIENT BIRTH FIELDS END--- */

    religionId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'religionId',
      yup.string(),
      'Religion',
    ),
    birthCertificate: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'birthCertificate',
      yup.string(),
      'Birth certificate',
    ),
    passport: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'passport',
      yup.string(),
      'Passport',
    ),
    primaryContactNumber: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'primaryContactNumber',
      yup.number(),
      'Primary contact number',
    ),
    secondaryContactNumber: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'secondaryContactNumber',
      yup.number(),
      'Secondary contact number',
    ),
    emergencyContactName: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'emergencyContactName',
      yup.string(),
      'Emergency contact name',
    ),
    emergencyContactNumber: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'emergencyContactNumber',
      yup.number(),
      'Emergency contact number',
    ),
    title: requiredWhenConfiguredMandatory(getLocalisation, getTranslation, 'title', yup.string()),
    bloodType: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'bloodType',
      yup.string(),
      'Blood type',
    ),
    placeOfBirth: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'placeOfBirth',
      yup.string(),
      'Birth location',
    ),
    countryOfBirthId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'countryOfBirthId',
      yup.string(),
      'Country of birth',
    ),
    nationalityId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'nationalityId',
      yup.string(),
      'Nationality',
    ),
    ethnicityId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'ethnicityId',
      yup.string(),
      'Ethnicity',
    ),
    patientBillingTypeId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'patientBillingTypeId',
      yup.string(),
      'Type',
    ),
    motherId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'motherId',
      yup.string(),
      'Mother',
    ),
    fatherId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'fatherId',
      yup.string(),
      'Father',
    ),
    subdivisionId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'subdivisionId',
      yup.string(),
      'Sub division',
    ),
    divisionId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'divisionId',
      yup.string(),
      'Division',
    ),
    countryId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'countryId',
      yup.string(),
      'Country',
    ),
    settlementId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'settlementId',
      yup.string(),
      'Settlement',
    ),
    medicalAreaId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'medicalAreaId',
      yup.string(),
      'Medical area',
    ),
    nursingZoneId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'nursingZoneId',
      yup.string(),
      'Nursing zone',
    ),
    streetVillage: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'streetVillage',
      yup.string(),
      'Residential landmark',
    ),
    villageId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'villageId',
      yup.string(),
      'Village',
    ),
    cityTown: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'cityTown',
      yup.string(),
      'City/town',
    ),
    drivingLicense: yup.string().when({
      is: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT,
      then: requiredWhenConfiguredMandatory(
        getLocalisation,
        getTranslation,
        'drivingLicense',
        yup.string(),
        'Driving license',
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
        'Marital status',
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
        'Occupation',
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
        'Educational attainment',
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
        'Social media',
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
