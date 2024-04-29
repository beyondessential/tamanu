import React from 'react';
import * as yup from 'yup';
import { isEqual } from 'lodash';

import {
  BIRTH_DELIVERY_TYPES,
  BIRTH_TYPES,
  PATIENT_REGISTRY_TYPES,
  PLACE_OF_BIRTH_TYPES,
} from '@tamanu/constants';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { yupAttemptTransformToNumber } from '../utils';

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
      `${getTranslation(`general.localisedField.${name}.label.short`, fallbackLabel)} is required`,
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
    firstName: yup
      .string()
      .required()
      .translatedLabel(
        <TranslatedText stringId="general.localisedField.firstName.label" fallback="First name" />,
      ),
    middleName: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'middleName',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.middleName.label"
            fallback="Middle name"
          />,
        ),
      'Middle name',
    ),
    lastName: yup
      .string()
      .required()
      .translatedLabel(
        <TranslatedText stringId="general.localisedField.lastName.label" fallback="Last name" />,
      ),
    culturalName: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'culturalName',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.culturalName.label"
            fallback="Cultural name"
          />,
        ),
      'Cultural name',
    ),
    dateOfBirth: yup
      .date()
      .required()
      .translatedLabel(
        <TranslatedText
          stringId="general.localisedField.dateOfBirth.label"
          fallback="Date of birth"
        />,
      ),
    sex: yup
      .string()
      .oneOf(sexValues)
      .required()
      .translatedLabel(
        <TranslatedText stringId="general.localisedField.sex.label" fallback="Sex" />,
      ),
    email: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'email',
      yup
        .string()
        .email()
        .translatedLabel(
          <TranslatedText stringId="general.localisedField.email.label" fallback="Email address" />,
        ),
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
        yup
          .string()
          .translatedLabel(
            <TranslatedText
              stringId="general.localisedField.birthFacilityId.label"
              fallback="Name of health facility (if applicable)"
            />,
          ),
        'Name of health facility (if applicable)',
      ),
      otherwise: yup.string(),
    }),

    attendantAtBirth: requiredBirthFieldWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      patientRegistryType,
      'attendantAtBirth',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.attendantAtBirth.label"
            fallback="Attendant at birth"
          />,
        ),
      'Attendant at birth',
    ),
    nameOfAttendantAtBirth: requiredBirthFieldWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      patientRegistryType,
      'nameOfAttendantAtBirth',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.nameOfAttendantAtBirth.label"
            fallback="Name of attendant"
          />,
        ),
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
        .max(6)
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.birthWeight.label"
            fallback="Birth weight (kg)"
          />,
        ),
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
        .max(100)
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.birthLength.label"
            fallback="Birth length (cm)"
          />,
        ),
      'Birth length (cm)',
    ),
    birthDeliveryType: requiredBirthFieldWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      patientRegistryType,
      'birthDeliveryType',
      yup
        .string()
        .oneOf(Object.values(BIRTH_DELIVERY_TYPES))
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.birthDeliveryType.label"
            fallback="Delivery type"
          />,
        ),
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
        .max(45)
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.gestationalAgeEstimate.label"
            fallback="Gestational age (weeks)"
          />,
        ),
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
        .max(10)
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.apgarScoreOneMinute.label"
            fallback="Apgar score at 1 min"
          />,
        ),
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
        .max(10)
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.apgarScoreFiveMinute.label"
            fallback="Apgar score at 5 min"
          />,
        ),
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
        .max(10)
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.apgarScoreTenMinute.label"
            fallback="Apgar score at 10 min"
          />,
        ),
      'Apgar score at 10 min',
    ),
    birthType: requiredBirthFieldWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      patientRegistryType,
      'birthType',
      yup
        .string()
        .oneOf(Object.values(BIRTH_TYPES))
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.birthType.label"
            fallback="Single/Plural birth"
          />,
        ),
      'Single/Plural birth',
    ),
    timeOfBirth: requiredBirthFieldWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      patientRegistryType,
      'timeOfBirth',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.timeOfBirth.label"
            fallback="Time of birth"
          />,
        ),
      'Time of birth',
    ),
    registeredBirthPlace: requiredBirthFieldWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      patientRegistryType,
      'registeredBirthPlace',
      yup
        .string()
        .oneOf(Object.values(PLACE_OF_BIRTH_TYPES))
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.registeredBirthPlace.label"
            fallback="Place of birth"
          />,
        ),
      'Place of birth',
    ),
    /* --- PATIENT BIRTH FIELDS END--- */

    religionId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'religionId',
      yup
        .string()
        .translatedLabel(
          <TranslatedText stringId="general.localisedField.religionId.label" fallback="Religion" />,
        ),
      'Religion',
    ),
    birthCertificate: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'birthCertificate',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.birthCertificate.label"
            fallback="Birth certificate"
          />,
        ),
      'Birth certificate',
    ),
    passport: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'passport',
      yup
        .string()
        .translatedLabel(
          <TranslatedText stringId="general.localisedField.passport.label" fallback="Passport" />,
        ),
      'Passport',
    ),
    primaryContactNumber: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'primaryContactNumber',
      yup
        .number()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.primaryContactNumber.label"
            fallback="Primary contact number"
          />,
        )
        .transform(yupAttemptTransformToNumber),
      'Primary contact number',
    ),
    secondaryContactNumber: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'secondaryContactNumber',
      yup
        .number()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.secondaryContactNumber.label"
            fallback="Secondary contact number"
          />,
        )
        .transform(yupAttemptTransformToNumber),
      'Secondary contact number',
    ),
    emergencyContactName: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'emergencyContactName',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.emergencyContactName.label"
            fallback="Emergency contact name"
          />,
        ),
      'Emergency contact name',
    ),
    emergencyContactNumber: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'emergencyContactNumber',
      yup
        .number()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.emergencyContactNumber.label"
            fallback="Emergency contact number"
          />,
        )
        .transform(yupAttemptTransformToNumber),
      'Emergency contact number',
    ),
    title: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'title',
      yup
        .string()
        .translatedLabel(
          <TranslatedText stringId="general.localisedField.title.label" fallback="Title" />,
        ),
    ),
    bloodType: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'bloodType',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.bloodType.label"
            fallback="Blood type"
          />,
        ),
      'Blood type',
    ),
    placeOfBirth: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'placeOfBirth',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.placeOfBirth.label"
            fallback="BirthLocation"
          />,
        ),
      'Birth location',
    ),
    countryOfBirthId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'countryOfBirthId',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.countryOfBirthId.label"
            fallback="Country of birth"
          />,
        ),
      'Country of birth',
    ),
    nationalityId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'nationalityId',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.nationalityId.label"
            fallback="Nationality"
          />,
        ),
      'Nationality',
    ),
    ethnicityId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'ethnicityId',
      yup
        .string()
        .translatedLabel(
          <TranslatedText stringId="general.localisedField.ethnicity.label" fallback="Ethnicity" />,
        ),
      'Ethnicity',
    ),
    patientBillingTypeId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'patientBillingTypeId',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.patientBillingTypeId.label"
            fallback="Type"
          />,
        ),
      'Type',
    ),
    motherId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'motherId',
      yup
        .string()
        .translatedLabel(
          <TranslatedText stringId="general.localisedField.motherId.label" fallback="Mother" />,
        ),
      'Mother',
    ),
    fatherId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'fatherId',
      yup
        .string()
        .translatedLabel(
          <TranslatedText stringId="general.localisedField.father.label" fallback="Father" />,
        ),
      'Father',
    ),
    subdivisionId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'subdivisionId',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.subdivisionId.label"
            fallback="Sub division"
          />,
        ),
      'Sub division',
    ),
    divisionId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'divisionId',
      yup
        .string()
        .translatedLabel(
          <TranslatedText stringId="general.localisedField.divisionId.label" fallback="Division" />,
        ),
      'Division',
    ),
    countryId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'countryId',
      yup
        .string()
        .translatedLabel(
          <TranslatedText stringId="general.localisedField.countryId.label" fallback="Country" />,
        ),
      'Country',
    ),
    settlementId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'settlementId',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.settlementId.label"
            fallback="Settlement"
          />,
        ),
      'Settlement',
    ),
    medicalAreaId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'medicalAreaId',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.medicalAreaId.label"
            fallback="Medical area"
          />,
        ),
      'Medical area',
    ),
    nursingZoneId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'nursingZoneId',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.nursingZoneId.label"
            fallback="Nursing zone"
          />,
        ),
      'Nursing zone',
    ),
    streetVillage: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'streetVillage',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.streetVillage.label"
            fallback="Residential landmark"
          />,
        ),
      'Residential landmark',
    ),
    villageId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'villageId',
      yup
        .string()
        .translatedLabel(
          <TranslatedText stringId="general.localisedField.villageId.label" fallback="Village" />,
        ),
      'Village',
    ),
    cityTown: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'cityTown',
      yup
        .string()
        .translatedLabel(
          <TranslatedText stringId="general.localisedField.cityTown.label" fallback="City/town" />,
        ),
      'City/town',
    ),
    healthCenterId: requiredWhenConfiguredMandatory(
      getLocalisation,
      getTranslation,
      'healthCenterId',
      yup.string(),
      'Health center',
    ),
    drivingLicense: yup.string().when({
      is: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT,
      then: requiredWhenConfiguredMandatory(
        getLocalisation,
        getTranslation,
        'drivingLicense',
        yup
          .string()
          .translatedLabel(
            <TranslatedText
              stringId="general.localisedField.drivingLicense.label"
              fallback="Driving license"
            />,
          ),
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
        yup
          .string()
          .translatedLabel(
            <TranslatedText
              stringId="general.localisedField.maritalStatus.label"
              fallback="Marital status"
            />,
          ),
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
        yup
          .string()
          .translatedLabel(
            <TranslatedText
              stringId="general.localisedField.occupationId.label"
              fallback="Occupation"
            />,
          ),
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
        yup
          .string()
          .translatedLabel(
            <TranslatedText
              stringId="general.localisedField.educationalLevel.label"
              fallback="Educational attainment"
            />,
          ),
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
        yup
          .string()
          .translatedLabel(
            <TranslatedText
              stringId="general.localisedField.socialMedia.label"
              fallback="Social media"
            />,
          ),
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
