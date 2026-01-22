import React from 'react';
import * as Yup from 'yup';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { yupAttemptTransformToNumber } from '~/ui/helpers/numeralTranslation';

const requiredWhenConfiguredMandatory = (
  getSetting: <T>(key: string) => T,
  name: string,
  baseType,
) => {
  return baseType.when([], {
    is: () => getSetting<boolean>(`fields.${name}.requiredPatientData`),
    then: baseType.required(),
    otherwise: baseType.nullable(),
  });
};

export const getPatientDetailsValidation = (getSetting: <T>(key: string) => T) => {
  return Yup.object().shape({
    firstName: Yup.string()
      .required()
      .translatedLabel(
        <TranslatedText stringId="general.localisedField.firstName.label" fallback="First name" />,
      ),
    middleName: requiredWhenConfiguredMandatory(
      getSetting,
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
      getSetting,
      'culturalName',
      Yup.string().translatedLabel(
        <TranslatedText
          stringId="general.localisedField.culturalName.label"
          fallback="Cultural/traditional name"
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
      getSetting,
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
      getSetting,
      'village',
      Yup.string().translatedLabel(
        <TranslatedText stringId="general.localisedField.villageId.label" fallback="Village" />,
      ),
    ),
    religionId: requiredWhenConfiguredMandatory(
      getSetting,
      'religionId',
      Yup.string().translatedLabel(
        <TranslatedText stringId="general.localisedField.religionId.label" fallback="Religion" />,
      ),
    ),
    birthCertificate: requiredWhenConfiguredMandatory(
      getSetting,
      'birthCertificate',
      Yup.string().translatedLabel(
        <TranslatedText
          stringId="general.localisedField.birthCertificate.label"
          fallback="Birth certificate"
        />,
      ),
    ),
    passport: requiredWhenConfiguredMandatory(
      getSetting,
      'passport',
      Yup.string().translatedLabel(
        <TranslatedText stringId="general.localisedField.passport.label.short" fallback="Passport" />,
      ),
    ),
    primaryContactNumber: requiredWhenConfiguredMandatory(
      getSetting,
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
      getSetting,
      'secondaryContactNumber',
      Yup.number()
        .transform(yupAttemptTransformToNumber)
        .nullable()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.secondaryContactNumber.label"
            fallback="Secondary contact number"
          />,
        ),
    ),
    emergencyContactName: requiredWhenConfiguredMandatory(
      getSetting,
      'emergencyContactName',
      Yup.string().translatedLabel(
        <TranslatedText
          stringId="general.localisedField.emergencyContactName.label"
          fallback="Emergency contact name"
        />,
      ),
    ),
    emergencyContactNumber: requiredWhenConfiguredMandatory(
      getSetting,
      'emergencyContactNumber',
      Yup.number()
        .transform(yupAttemptTransformToNumber)
        .nullable()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.emergencyContactNumber.label"
            fallback="Emergency contact number"
          />,
        ),
    ),
    title: requiredWhenConfiguredMandatory(
      getSetting,
      'title',
      Yup.string().translatedLabel(
        <TranslatedText stringId="general.localisedField.title.label" fallback="Title" />,
      ),
    ),
    bloodType: requiredWhenConfiguredMandatory(
      getSetting,
      'bloodType',
      Yup.string().translatedLabel(
        <TranslatedText stringId="general.localisedField.bloodType.label" fallback="Blood type" />,
      ),
    ),
    placeOfBirth: requiredWhenConfiguredMandatory(
      getSetting,
      'placeOfBirth',
      Yup.string().translatedLabel(
        <TranslatedText
          stringId="general.localisedField.placeOfBirth.label"
          fallback="Birth location"
        />,
      ),
    ),
    countryOfBirthId: requiredWhenConfiguredMandatory(
      getSetting,
      'countryOfBirthId',
      Yup.string().translatedLabel(
        <TranslatedText
          stringId="general.localisedField.countryOfBirthId.label"
          fallback="Country of birth"
        />,
      ),
    ),
    nationalityId: requiredWhenConfiguredMandatory(
      getSetting,
      'nationalityId',
      Yup.string().translatedLabel(
        <TranslatedText
          stringId="general.localisedField.nationalityId.label"
          fallback="Nationality"
        />,
      ),
    ),
    ethnicityId: requiredWhenConfiguredMandatory(
      getSetting,
      'ethnicityId',
      Yup.string().translatedLabel(
        <TranslatedText stringId="general.localisedField.ethnicityId.label" fallback="Ethnicity" />,
      ),
    ),
    patientBillingTypeId: requiredWhenConfiguredMandatory(
      getSetting,
      'patientBillingTypeId',
      Yup.string().translatedLabel(
        <TranslatedText
          stringId="general.localisedField.patientBillingTypeId.label.short"
          fallback="Type"
        />,
      ),
    ),
    subdivisionId: requiredWhenConfiguredMandatory(
      getSetting,
      'subdivisionId',
      Yup.string().translatedLabel(
        <TranslatedText
          stringId="general.localisedField.subdivisionId.label"
          fallback="Sub division"
        />,
      ),
    ),
    divisionId: requiredWhenConfiguredMandatory(
      getSetting,
      'divisionId',
      Yup.string().translatedLabel(
        <TranslatedText stringId="general.localisedField.divisionId.label" fallback="Division" />,
      ),
    ),
    countryId: requiredWhenConfiguredMandatory(
      getSetting,
      'countryId',
      Yup.string().translatedLabel(
        <TranslatedText stringId="general.localisedField.countryId.label" fallback="Country" />,
      ),
    ),
    settlementId: requiredWhenConfiguredMandatory(
      getSetting,
      'settlementId',
      Yup.string().translatedLabel(
        <TranslatedText
          stringId="general.localisedField.settlementId.label"
          fallback="Settlement"
        />,
      ),
    ),
    medicalAreaId: requiredWhenConfiguredMandatory(
      getSetting,
      'medicalAreaId',
      Yup.string().translatedLabel(
        <TranslatedText
          stringId="general.localisedField.medicalAreaId.label"
          fallback="Medical area"
        />,
      ),
    ),
    nursingZoneId: requiredWhenConfiguredMandatory(
      getSetting,
      'nursingZoneId',
      Yup.string().translatedLabel(
        <TranslatedText
          stringId="general.localisedField.nursingZoneId.label"
          fallback="Nursing zone"
        />,
      ),
    ),
    streetVillage: requiredWhenConfiguredMandatory(
      getSetting,
      'streetVillage',
      Yup.string().translatedLabel(
        <TranslatedText
          stringId="general.localisedField.streetVillage.label"
          fallback="Residential landmark"
        />,
      ),
    ),
    cityTown: requiredWhenConfiguredMandatory(
      getSetting,
      'cityTown',
      Yup.string().translatedLabel(
        <TranslatedText stringId="general.localisedField.cityTown.label" fallback="City/town" />,
      ),
    ),
    drivingLicense: requiredWhenConfiguredMandatory(
      getSetting,
      'drivingLicense',
      Yup.string().translatedLabel(
        <TranslatedText
          stringId="general.localisedField.drivingLicense.label"
          fallback="Driving license"
        />,
      ),
    ),
    maritalStatus: requiredWhenConfiguredMandatory(
      getSetting,
      'maritalStatus',
      Yup.string().translatedLabel(
        <TranslatedText
          stringId="general.localisedField.maritalStatus.label"
          fallback="Marital status"
        />,
      ),
    ),
    occupationId: requiredWhenConfiguredMandatory(
      getSetting,
      'occupationId',
      Yup.string().translatedLabel(
        <TranslatedText
          stringId="general.localisedField.occupationId.label"
          fallback="Occupation"
        />,
      ),
    ),
    educationalLevel: requiredWhenConfiguredMandatory(
      getSetting,
      'educationalLevel',
      Yup.string().translatedLabel(
        <TranslatedText
          stringId="general.localisedField.educationalLevel.label"
          fallback="Educational attainment"
        />,
      ),
    ),
    socialMedia: requiredWhenConfiguredMandatory(
      getSetting,
      'socialMedia',
      Yup.string().translatedLabel(
        <TranslatedText
          stringId="general.localisedField.socialMedia.label"
          fallback="Social media"
        />,
      ),
    ),
  });
};
