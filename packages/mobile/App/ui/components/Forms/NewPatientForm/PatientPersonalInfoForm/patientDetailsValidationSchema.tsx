import React from 'react';
import * as Yup from 'yup';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { yupAttemptTransformToNumber } from '~/ui/helpers/numeralTranslation';

const requiredWhenConfiguredMandatory = (getBool, name, label, baseType) => {
  return baseType.when([], {
    is: () => !!getBool(`fields.${name}.requiredPatientData`),
    then: baseType.required().translatedText(label),
    otherwise: baseType.nullable(),
  });
};

export const getPatientDetailsValidation = (getBool, getString) => {
  return Yup.object().shape({
    firstName: Yup.string()
      .required()
      .translatedLabel(
        <TranslatedText stringId="general.localisedField.firstName.label" fallback="First name" />,
      ),
    middleName: requiredWhenConfiguredMandatory(
      getBool,
      'middleName',
      <TranslatedText stringId="general.localisedField.middleName.label" fallback="Middle name" />,
      Yup.string(),
    ),
    lastName: Yup.string()
      .required()
      .translatedLabel(
        <TranslatedText stringId="general.localisedField.lastName.label" fallback="Last name" />,
      ),
    culturalName: requiredWhenConfiguredMandatory(
      getBool,
      'culturalName',
      <TranslatedText
        stringId="general.localisedField.culturalName.label"
        fallback="Cultural name"
      />,
      Yup.string(),
    ),
    dateOfBirth: Yup.date()
      .required()
      .translatedLabel(
        <TranslatedText
          stringId="general.localisedField.dateOfBirth.label"
          fallback="Date of birth"
        />,
      ),
    email: requiredWhenConfiguredMandatory(
      getBool,
      'email',
      <TranslatedText stringId="general.localisedField.email.label" fallback="Email address" />,
      Yup.string(),
    ),
    sex: Yup.string()
      .required()
      .translatedLabel(
        <TranslatedText stringId="general.localisedField.sex.label" fallback="Sex" />,
      ),
    village: requiredWhenConfiguredMandatory(
      getBool,
      'village',
      <TranslatedText stringId="general.localisedField.villageId.label" fallback="Village" />,
      Yup.string(),
    ),
    religionId: requiredWhenConfiguredMandatory(
      getBool,
      'religionId',
      <TranslatedText stringId="general.localisedField.religionId.label" fallback="Religion" />,
      Yup.string(),
    ),
    birthCertificate: requiredWhenConfiguredMandatory(
      getBool,
      getString,
      'birthCertificate',
      Yup.string(),
    ),
    passport: requiredWhenConfiguredMandatory(getBool, getString, 'passport', Yup.string()),
    primaryContactNumber: requiredWhenConfiguredMandatory(
      getBool,
      getString,
      'primaryContactNumber',
      Yup.number()
        .transform(yupAttemptTransformToNumber)
        .nullable(),
    ),
    secondaryContactNumber: requiredWhenConfiguredMandatory(
      getBool,
      getString,
      'secondaryContactNumber',
      Yup.number()
        .transform(yupAttemptTransformToNumber)
        .nullable(),
    ),
    emergencyContactName: requiredWhenConfiguredMandatory(
      getBool,
      getString,
      'emergencyContactName',
      Yup.string(),
    ),
    emergencyContactNumber: requiredWhenConfiguredMandatory(
      getBool,
      getString,
      'emergencyContactNumber',
      Yup.number()
        .transform(yupAttemptTransformToNumber)
        .nullable(),
    ),
    title: requiredWhenConfiguredMandatory(getBool, getString, 'title', Yup.string()),
    bloodType: requiredWhenConfiguredMandatory(getBool, getString, 'bloodType', Yup.string()),
    placeOfBirth: requiredWhenConfiguredMandatory(getBool, getString, 'placeOfBirth', Yup.string()),
    countryOfBirthId: requiredWhenConfiguredMandatory(
      getBool,
      getString,
      'countryOfBirthId',
      Yup.string(),
    ),
    nationalityId: requiredWhenConfiguredMandatory(
      getBool,
      getString,
      'nationalityId',
      Yup.string(),
    ),
    ethnicityId: requiredWhenConfiguredMandatory(getBool, getString, 'ethnicityId', Yup.string()),
    patientBillingTypeId: requiredWhenConfiguredMandatory(
      getBool,
      getString,
      'patientBillingTypeId',
      Yup.string(),
    ),
    subdivisionId: requiredWhenConfiguredMandatory(
      getBool,
      getString,
      'subdivisionId',
      Yup.string(),
    ),
    divisionId: requiredWhenConfiguredMandatory(getBool, getString, 'divisionId', Yup.string()),
    countryId: requiredWhenConfiguredMandatory(getBool, getString, 'countryId', Yup.string()),
    settlementId: requiredWhenConfiguredMandatory(getBool, getString, 'settlementId', Yup.string()),
    medicalAreaId: requiredWhenConfiguredMandatory(
      getBool,
      getString,
      'medicalAreaId',
      Yup.string(),
    ),
    nursingZoneId: requiredWhenConfiguredMandatory(
      getBool,
      getString,
      'nursingZoneId',
      Yup.string(),
    ),
    streetVillage: requiredWhenConfiguredMandatory(
      getBool,
      getString,
      'streetVillage',
      Yup.string(),
    ),
    cityTown: requiredWhenConfiguredMandatory(getBool, getString, 'cityTown', Yup.string()),
    drivingLicense: requiredWhenConfiguredMandatory(
      getBool,
      getString,
      'drivingLicense',
      Yup.string(),
    ),
    maritalStatus: requiredWhenConfiguredMandatory(
      getBool,
      getString,
      'maritalStatus',
      Yup.string(),
    ),
    occupationId: requiredWhenConfiguredMandatory(getBool, getString, 'occupationId', Yup.string()),
    educationalLevel: requiredWhenConfiguredMandatory(
      getBool,
      getString,
      'educationalLevel',
      Yup.string(),
    ),
    socialMedia: requiredWhenConfiguredMandatory(getBool, getString, 'socialMedia', Yup.string()),
  });
};
