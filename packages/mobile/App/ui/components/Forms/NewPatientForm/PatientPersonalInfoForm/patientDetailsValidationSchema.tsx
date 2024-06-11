import React from 'react';
import * as Yup from 'yup';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { yupAttemptTransformToNumber } from '~/ui/helpers/numeralTranslation';

const requiredWhenConfiguredMandatory = (getBool, name, baseType) => {
  return baseType.when([], {
    is: () => !!getBool(`fields.${name}.requiredPatientData`),
    then: baseType.required(),
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
      Yup.string().translatedLabel(
        <TranslatedText
          stringId="general.localisedField.middleName.label"
          fallback="Middle name"
        />,
      ),
    ),
    lastName: Yup.string()
      .required()
      .translatedLabel(
        <TranslatedText stringId="general.localisedField.lastName.label" fallback="Last name" />,
      ),
    culturalName: requiredWhenConfiguredMandatory(
      getBool,
      'culturalName',
      Yup.string().translatedLabel(
        <TranslatedText
          stringId="general.localisedField.culturalName.label"
          fallback="Cultural name"
        />,
      ),
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

      Yup.string().translatedLabel(
        <TranslatedText stringId="general.localisedField.email.label" fallback="Email address" />,
      ),
    ),
    sex: Yup.string()
      .required()
      .translatedLabel(
        <TranslatedText stringId="general.localisedField.sex.label" fallback="Sex" />,
      ),
    village: requiredWhenConfiguredMandatory(
      getBool,
      'village',
      Yup.string().translatedLabel(
        <TranslatedText stringId="general.localisedField.villageId.label" fallback="Village" />,
      ),
    ),
    religionId: requiredWhenConfiguredMandatory(
      getBool,
      'religionId',
      Yup.string().translatedLabel(
        <TranslatedText stringId="general.localisedField.religionId.label" fallback="Religion" />,
      ),
    ),
    birthCertificate: requiredWhenConfiguredMandatory(
      getBool,
      'birthCertificate',
      Yup.string().translatedLabel(
        <TranslatedText
          stringId="general.localisedField.birthCertificate.label"
          fallback="Birth certificate"
        />,
      ),
    ),
    passport: requiredWhenConfiguredMandatory(
      getBool,
      'passport',
      Yup.string().translatedLabel(
        <TranslatedText stringId="general.localisedField.passport.label" fallback="Passport" />,
      ),
    ),
    primaryContactNumber: requiredWhenConfiguredMandatory(
      getBool,
      'primaryContactNumber',
      Yup.number()
        .transform(yupAttemptTransformToNumber)
        .nullable()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.primaryContactNumber.label"
            fallback="Primary contact number"
          />,
        ),
    ),
    secondaryContactNumber: requiredWhenConfiguredMandatory(
      getBool,
      'secondaryContactNumber',
      Yup.number()
        .transform(yupAttemptTransformToNumber)
        .nullable(),
    ),
    emergencyContactName: requiredWhenConfiguredMandatory(
      getBool,
      'emergencyContactName',
      Yup.string(),
    ),
    emergencyContactNumber: requiredWhenConfiguredMandatory(
      getBool,
      'emergencyContactNumber',
      Yup.number()
        .transform(yupAttemptTransformToNumber)
        .nullable(),
    ),
    title: requiredWhenConfiguredMandatory(getBool, getString, 'title', Yup.string()),
    bloodType: requiredWhenConfiguredMandatory(getBool, getString, 'bloodType', Yup.string()),
    placeOfBirth: requiredWhenConfiguredMandatory(getBool, getString, 'placeOfBirth', Yup.string()),
    countryOfBirthId: requiredWhenConfiguredMandatory(getBool, 'countryOfBirthId', Yup.string()),
    nationalityId: requiredWhenConfiguredMandatory(getBool, 'nationalityId', Yup.string()),
    ethnicityId: requiredWhenConfiguredMandatory(getBool, getString, 'ethnicityId', Yup.string()),
    patientBillingTypeId: requiredWhenConfiguredMandatory(
      getBool,
      'patientBillingTypeId',
      Yup.string(),
    ),
    subdivisionId: requiredWhenConfiguredMandatory(getBool, 'subdivisionId', Yup.string()),
    divisionId: requiredWhenConfiguredMandatory(getBool, getString, 'divisionId', Yup.string()),
    countryId: requiredWhenConfiguredMandatory(getBool, getString, 'countryId', Yup.string()),
    settlementId: requiredWhenConfiguredMandatory(getBool, getString, 'settlementId', Yup.string()),
    medicalAreaId: requiredWhenConfiguredMandatory(getBool, 'medicalAreaId', Yup.string()),
    nursingZoneId: requiredWhenConfiguredMandatory(getBool, 'nursingZoneId', Yup.string()),
    streetVillage: requiredWhenConfiguredMandatory(getBool, 'streetVillage', Yup.string()),
    cityTown: requiredWhenConfiguredMandatory(getBool, getString, 'cityTown', Yup.string()),
    drivingLicense: requiredWhenConfiguredMandatory(getBool, 'drivingLicense', Yup.string()),
    maritalStatus: requiredWhenConfiguredMandatory(getBool, 'maritalStatus', Yup.string()),
    occupationId: requiredWhenConfiguredMandatory(getBool, getString, 'occupationId', Yup.string()),
    educationalLevel: requiredWhenConfiguredMandatory(getBool, 'educationalLevel', Yup.string()),
    socialMedia: requiredWhenConfiguredMandatory(getBool, getString, 'socialMedia', Yup.string()),
  });
};
