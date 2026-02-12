import React from 'react';
import * as yup from 'yup';
import { isEqual } from 'lodash';

import {
  BIRTH_DELIVERY_TYPES,
  BIRTH_TYPES,
  PATIENT_REGISTRY_TYPES,
  PLACE_OF_BIRTH_TYPES,
  SEX_VALUES,
} from '@tamanu/constants';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { yupAttemptTransformToNumber } from '../utils';

const requiredWhenConfiguredMandatory = (getSetting, getTranslation, name, baseType) => {
  return baseType.when([], {
    is: () => !!getSetting(`fields.${name}.requiredPatientData`),
    then: baseType.required(getTranslation('validation.required.inline', '*Required')),
    otherwise: baseType,
  });
};

const requiredBirthFieldWhenConfiguredMandatory = (
  getSetting,
  getTranslation,
  patientRegistryType,
  name,
  baseType,
  fallbackLabel,
) =>
  baseType.when([], {
    is: () => patientRegistryType === PATIENT_REGISTRY_TYPES.BIRTH_REGISTRY,
    then: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      name,
      baseType,
      fallbackLabel,
    ),
    otherwise: baseType,
  });

export const getPatientDetailsValidation = (patientRegistryType, getSetting, getTranslation) => {
  const patientDetailsValidationSchema = yup.object().shape({
    firstName: yup
      .string()
      .required()
      .translatedLabel(
        <TranslatedText stringId="general.localisedField.firstName.label" fallback="First name" />,
      ),
    middleName: requiredWhenConfiguredMandatory(
      getSetting,
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
      getSetting,
      getTranslation,
      'culturalName',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.culturalName.label"
            fallback="Cultural/traditional name"
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
      .oneOf(
        Object.values(SEX_VALUES).filter(value =>
          getSetting('features.hideOtherSex') === true ? value !== SEX_VALUES.OTHER : true,
        ),
      )
      .required()
      .translatedLabel(
        <TranslatedText stringId="general.localisedField.sex.label" fallback="Sex" />,
      ),
    email: requiredWhenConfiguredMandatory(
      getSetting,
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
        getSetting,
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
      getSetting,
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
      getSetting,
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
      getSetting,
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
      getSetting,
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
      getSetting,
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
      getSetting,
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
      getSetting,
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
      getSetting,
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
      getSetting,
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
      getSetting,
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
      getSetting,
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
      getSetting,
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
      getSetting,
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
      getSetting,
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
    insurerId: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'insurerId',
      yup
        .string()
        .translatedLabel(
          <TranslatedText stringId="general.localisedField.insurer.label" fallback="Insurer" />,
        ),
      'Insurer',
    ),
    insurerPolicyNumber: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'insurerPolicyNumber',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.insurerPolicyNumber.label"
            fallback="Insurance policy number"
          />,
        ),
      'Insurance policy number',
    ),
    passport: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'passport',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.passport.label.short"
            fallback="Passport"
          />,
        ),
      'Passport',
    ),
    primaryContactNumber: requiredWhenConfiguredMandatory(
      getSetting,
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
      getSetting,
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
      getSetting,
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
      getSetting,
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
      getSetting,
      getTranslation,
      'title',
      yup
        .string()
        .translatedLabel(
          <TranslatedText stringId="general.localisedField.title.label" fallback="Title" />,
        ),
    ),
    bloodType: requiredWhenConfiguredMandatory(
      getSetting,
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
      getSetting,
      getTranslation,
      'placeOfBirth',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.placeOfBirth.label"
            fallback="Birth location"
          />,
        ),
      'Birth location',
    ),
    countryOfBirthId: requiredWhenConfiguredMandatory(
      getSetting,
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
      getSetting,
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
      getSetting,
      getTranslation,
      'ethnicityId',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.ethnicityId.label"
            fallback="Ethnicity"
          />,
        ),
      'Ethnicity',
    ),
    patientBillingTypeId: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'patientBillingTypeId',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.patientBillingTypeId.label.short"
            fallback="Type"
          />,
        ),
      'Type',
    ),
    motherId: requiredWhenConfiguredMandatory(
      getSetting,
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
      getSetting,
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
      getSetting,
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
      getSetting,
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
      getSetting,
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
      getSetting,
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
      getSetting,
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
      getSetting,
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
      getSetting,
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
      getSetting,
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
      getSetting,
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
      getSetting,
      getTranslation,
      'healthCenterId',
      yup.string(),
      'Health center',
    ),
    drivingLicense: yup.string().when({
      is: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT,
      then: requiredWhenConfiguredMandatory(
        getSetting,
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
        getSetting,
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
        getSetting,
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
        getSetting,
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
        getSetting,
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
  const localisedFields = getSetting('fields');
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
