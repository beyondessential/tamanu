import React from 'react';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { ADDITIONAL_DATA_FIELDS } from '~/ui/helpers/additionalData';
import { PATIENT_DATA_FIELDS } from '~/ui/helpers/patient';

export const labels = {
  [PATIENT_DATA_FIELDS.FIRST_NAME]: (
    <TranslatedText stringId="general.localisedField.firstName.label" fallback="First name" />
  ),
  [PATIENT_DATA_FIELDS.MIDDLE_NAME]: (
    <TranslatedText stringId="general.localisedField.middleName.label" fallback="Middle name" />
  ),
  [PATIENT_DATA_FIELDS.LAST_NAME]: (
    <TranslatedText stringId="general.localisedField.lastName.label" fallback="Last name" />
  ),
  [PATIENT_DATA_FIELDS.DATE_OF_BIRTH]: (
    <TranslatedText stringId="general.localisedField.dateOfBirth.label" fallback="Date of birth" />
  ),
  [PATIENT_DATA_FIELDS.SEX]: (
    <TranslatedText stringId="general.localisedField.sex.label" fallback="Sex" />
  ),
  [PATIENT_DATA_FIELDS.CULTURAL_NAME]: (
    <TranslatedText stringId="general.localisedField.culturalName.label" fallback="Cultural/traditional name" />
  ),
  [PATIENT_DATA_FIELDS.EMAIL]: (
    <TranslatedText stringId="general.localisedField.email.label" fallback="Email address" />
  ),
  [PATIENT_DATA_FIELDS.VILLAGE_ID]: (
    <TranslatedText stringId="general.localisedField.villageId.label" fallback="Village" />
  ),
  [ADDITIONAL_DATA_FIELDS.BIRTH_CERTIFICATE]: (
    <TranslatedText
      stringId="general.localisedField.birthCertificate.label"
      fallback="Birth certificate"
    />
  ),
  [ADDITIONAL_DATA_FIELDS.DRIVING_LICENSE]: (
    <TranslatedText
      stringId="general.localisedField.drivingLicense.label"
      fallback="Driving license"
    />
  ),
  [ADDITIONAL_DATA_FIELDS.PASSPORT]: (
    <TranslatedText stringId="general.localisedField.passport.label.short" fallback="Passport" />
  ),
  [ADDITIONAL_DATA_FIELDS.PRIMARY_CONTACT_NUMBER]: (
    <TranslatedText
      stringId="general.localisedField.primaryContactNumber.label"
      fallback="Primary contact number"
    />
  ),
  [ADDITIONAL_DATA_FIELDS.SECONDARY_CONTACT_NUMBER]: (
    <TranslatedText
      stringId="general.localisedField.secondaryContactNumber.label"
      fallback="Secondary contact number"
    />
  ),
  [ADDITIONAL_DATA_FIELDS.EMERGENCY_CONTACT_NAME]: (
    <TranslatedText
      stringId="general.localisedField.emergencyContactName.label"
      fallback="Emergency contact name"
    />
  ),
  [ADDITIONAL_DATA_FIELDS.EMERGENCY_CONTACT_NUMBER]: (
    <TranslatedText
      stringId="general.localisedField.emergencyContactNumber.label"
      fallback="Emergency contact number"
    />
  ),
  [ADDITIONAL_DATA_FIELDS.TITLE]: (
    <TranslatedText stringId="general.localisedField.title.label" fallback="Title" />
  ),
  [ADDITIONAL_DATA_FIELDS.MARITAL_STATUS]: (
    <TranslatedText
      stringId="general.localisedField.maritalStatus.label"
      fallback="Marital status"
    />
  ),
  [ADDITIONAL_DATA_FIELDS.BLOOD_TYPE]: (
    <TranslatedText stringId="general.localisedField.bloodType.label" fallback="Blood type" />
  ),
  [ADDITIONAL_DATA_FIELDS.PLACE_OF_BIRTH]: (
    <TranslatedText
      stringId="general.localisedField.placeOfBirth.label"
      fallback="Birth location"
    />
  ),
  [ADDITIONAL_DATA_FIELDS.COUNTRY_OF_BIRTH_ID]: (
    <TranslatedText
      stringId="general.localisedField.countryOfBirthId.label"
      fallback="Country of birth"
    />
  ),
  [ADDITIONAL_DATA_FIELDS.NATIONALITY_ID]: (
    <TranslatedText stringId="general.localisedField.nationalityId.label" fallback="Nationality" />
  ),
  [ADDITIONAL_DATA_FIELDS.ETHNICITY_ID]: (
    <TranslatedText stringId="general.localisedField.ethnicityId.label" fallback="Ethnicity" />
  ),
  [ADDITIONAL_DATA_FIELDS.RELIGION_ID]: (
    <TranslatedText stringId="general.localisedField.religionId.label" fallback="Religion" />
  ),
  [ADDITIONAL_DATA_FIELDS.EDUCATIONAL_LEVEL]: (
    <TranslatedText
      stringId="general.localisedField.educationalLevel.label"
      fallback="Educational attainment"
    />
  ),
  [ADDITIONAL_DATA_FIELDS.OCCUPATION_ID]: (
    <TranslatedText stringId="general.localisedField.occupationId.label" fallback="Occupation" />
  ),
  [ADDITIONAL_DATA_FIELDS.SOCIAL_MEDIA]: (
    <TranslatedText stringId="general.localisedField.socialMedia.label" fallback="Social media" />
  ),
  [ADDITIONAL_DATA_FIELDS.PATIENT_BILLING_TYPE_ID]: (
    <TranslatedText stringId="general.localisedField.patientBillingTypeId.label.short" fallback="Type" />
  ),
  [ADDITIONAL_DATA_FIELDS.STREET_VILLAGE]: (
    <TranslatedText
      stringId="general.localisedField.streetVillage.label"
      fallback="Residential landmark"
    />
  ),
  [ADDITIONAL_DATA_FIELDS.CITY_TOWN]: (
    <TranslatedText stringId="general.localisedField.cityTown.label" fallback="City/town" />
  ),
  [ADDITIONAL_DATA_FIELDS.SUBDIVISION_ID]: (
    <TranslatedText stringId="general.localisedField.subdivisionId.label" fallback="Sub division" />
  ),
  [ADDITIONAL_DATA_FIELDS.DIVISION_ID]: (
    <TranslatedText stringId="general.localisedField.divisionId.label" fallback="Division" />
  ),
  [ADDITIONAL_DATA_FIELDS.COUNTRY_ID]: (
    <TranslatedText stringId="general.localisedField.countryId.label" fallback="Country" />
  ),
  [ADDITIONAL_DATA_FIELDS.SETTLEMENT_ID]: (
    <TranslatedText stringId="general.localisedField.settlementId.label" fallback="Settlement" />
  ),
  [ADDITIONAL_DATA_FIELDS.MEDICAL_AREA_ID]: (
    <TranslatedText stringId="general.localisedField.medicalAreaId.label" fallback="Medical area" />
  ),
  [ADDITIONAL_DATA_FIELDS.NURSING_ZONE_ID]: (
    <TranslatedText stringId="general.localisedField.nursingZoneId.label" fallback="Nursing zone" />
  ),
  secondaryDivisionId: (
    <TranslatedText stringId="general.localisedField.province.label" fallback="Province" />
  ),
  secondarySubdivisionId: (
    <TranslatedText stringId="general.localisedField.district.label" fallback="District" />
  ),
  secondarySettlementId: (
    <TranslatedText stringId="general.localisedField.commune.label" fallback="Commune" />
  ),
  secondaryVillageId: (
    <TranslatedText stringId="general.localisedField.villageId.label" fallback="Village" />
  ),
};
