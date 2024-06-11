import React from 'react';
import * as Yup from 'yup';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { yupAttemptTransformToNumber } from '~/ui/helpers/numeralTranslation';

const requiredWhenConfiguredMandatory = (getBool, name, label, baseType) => {
  return baseType.when([], {
    is: () => !!getBool(`fields.${name}.requiredPatientData`),
    then: baseType.translatedText(label).required(),
    otherwise: baseType.nullable(),
  });
};

export const getPatientDetailsValidation = (getBool, getString) => {
  return Yup.object().shape({
    firstName: Yup.string()
      .translatedLabel(
        <TranslatedText stringId="general.localisedField.firstName.label" fallback="First name" />,
      )
      .required(),
    middleName: requiredWhenConfiguredMandatory(
      getBool,
      'middleName',
      <TranslatedText stringId="general.localisedField.middleName.label" fallback="Middle name" />,
      Yup.string(),
    ),
    lastName: Yup.string()
      .translatedLabel(
        <TranslatedText stringId="general.localisedField.lastName.label" fallback="Last name" />,
      )
      .required(),
    culturalName: requiredWhenConfiguredMandatory(getBool, getString, 'culturalName', Yup.string()),
    dateOfBirth: Yup.date()
      .translatedLabel(
        <TranslatedText
          stringId="general.localisedField.dateOfBirth.label"
          fallback="Date of birth"
        />,
      )
      .required(),
    email: requiredWhenConfiguredMandatory(getBool, getString, 'email', Yup.string()),
    sex: Yup.string().required('Sex is a required field'),
    village: requiredWhenConfiguredMandatory(getBool, getString, 'village', Yup.string()),
    religionId: requiredWhenConfiguredMandatory(getBool, getString, 'religionId', Yup.string()),
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
