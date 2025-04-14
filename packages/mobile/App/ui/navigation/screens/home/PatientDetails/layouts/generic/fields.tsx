import React from 'react';
import { TranslatedText } from '/components/Translations/TranslatedText';
import { ADDITIONAL_DATA_FIELDS } from '~/ui/helpers/additionalData';
import { ReferenceDataType } from '~/types/IReferenceData';
import { PATIENT_DATA_FIELDS } from '~/ui/helpers/patient';

export const ADDITIONAL_DATA_LOCATION_HIERARCHY_FIELDS = [
  {
    name: ADDITIONAL_DATA_FIELDS.DIVISION_ID,
    referenceType: ReferenceDataType.Division,
    label: (
      <TranslatedText stringId="general.localisedField.divisionId.label" fallback="Division" />
    ),
  },
  {
    name: ADDITIONAL_DATA_FIELDS.SUBDIVISION_ID,
    referenceType: ReferenceDataType.SubDivision,
    label: (
      <TranslatedText
        stringId="general.localisedField.subdivisionId.label"
        fallback="Sub division"
      />
    ),
  },
  {
    name: ADDITIONAL_DATA_FIELDS.SETTLEMENT_ID,
    referenceType: ReferenceDataType.Settlement,
    label: (
      <TranslatedText stringId="general.localisedField.settlementId.label" fallback="Settlement" />
    ),
  },
  {
    name: PATIENT_DATA_FIELDS.VILLAGE_ID,
    referenceType: ReferenceDataType.Village,
    label: <TranslatedText stringId="general.localisedField.villageId.label" fallback="Village" />,
  },
];

const GENERIC_ADDITIONAL_DATA_FIELDS = {
  IDENTIFICATION: [
    ADDITIONAL_DATA_FIELDS.BIRTH_CERTIFICATE,
    ADDITIONAL_DATA_FIELDS.DRIVING_LICENSE,
    ADDITIONAL_DATA_FIELDS.PASSPORT,
  ],
  CONTACT: [
    ADDITIONAL_DATA_FIELDS.PRIMARY_CONTACT_NUMBER,
    ADDITIONAL_DATA_FIELDS.SECONDARY_CONTACT_NUMBER,
    ADDITIONAL_DATA_FIELDS.EMERGENCY_CONTACT_NAME,
    ADDITIONAL_DATA_FIELDS.EMERGENCY_CONTACT_NUMBER,
  ],
  PERSONAL: [
    ADDITIONAL_DATA_FIELDS.TITLE,
    ADDITIONAL_DATA_FIELDS.MARITAL_STATUS,
    ADDITIONAL_DATA_FIELDS.BLOOD_TYPE,
    ADDITIONAL_DATA_FIELDS.PLACE_OF_BIRTH,
    ADDITIONAL_DATA_FIELDS.COUNTRY_OF_BIRTH_ID,
    ADDITIONAL_DATA_FIELDS.NATIONALITY_ID,
    ADDITIONAL_DATA_FIELDS.ETHNICITY_ID,
    ADDITIONAL_DATA_FIELDS.RELIGION_ID,
    ADDITIONAL_DATA_FIELDS.EDUCATIONAL_LEVEL,
    ADDITIONAL_DATA_FIELDS.OCCUPATION_ID,
    ADDITIONAL_DATA_FIELDS.SOCIAL_MEDIA,
    ADDITIONAL_DATA_FIELDS.PATIENT_BILLING_TYPE_ID,
  ],
  OTHER: [
    ADDITIONAL_DATA_FIELDS.STREET_VILLAGE,
    ADDITIONAL_DATA_FIELDS.CITY_TOWN,
    ADDITIONAL_DATA_FIELDS.SUBDIVISION_ID,
    ADDITIONAL_DATA_FIELDS.DIVISION_ID,
    ADDITIONAL_DATA_FIELDS.COUNTRY_ID,
    ADDITIONAL_DATA_FIELDS.SETTLEMENT_ID,
    ADDITIONAL_DATA_FIELDS.MEDICAL_AREA_ID,
    ADDITIONAL_DATA_FIELDS.NURSING_ZONE_ID,
  ],
  OTHER_WITH_HIERARCHY: [
    ADDITIONAL_DATA_FIELDS.DIVISION_ID,
    ADDITIONAL_DATA_FIELDS.SUBDIVISION_ID,
    ADDITIONAL_DATA_FIELDS.SETTLEMENT_ID,
    PATIENT_DATA_FIELDS.VILLAGE_ID,
    ADDITIONAL_DATA_FIELDS.CITY_TOWN,
    ADDITIONAL_DATA_FIELDS.COUNTRY_ID,
    ADDITIONAL_DATA_FIELDS.MEDICAL_AREA_ID,
    ADDITIONAL_DATA_FIELDS.NURSING_ZONE_ID,
    ADDITIONAL_DATA_FIELDS.STREET_VILLAGE,
  ],
};

export const GENERIC_ADDITIONAL_DATA_SECTIONS = [
  {
    sectionKey: 'identificationInformation',
    title: (
      <TranslatedText
        stringId="patient.details.subheading.identificationInformation"
        fallback="Identification information"
      />
    ),
    fields: GENERIC_ADDITIONAL_DATA_FIELDS.IDENTIFICATION,
  },
  {
    sectionKey: 'contactInformation',
    title: (
      <TranslatedText
        stringId="patient.details.subheading.contactInformation"
        fallback="Contact information"
      />
    ),
    fields: GENERIC_ADDITIONAL_DATA_FIELDS.CONTACT,
  },
  {
    sectionKey: 'personalInformation',
    title: (
      <TranslatedText
        stringId="patient.details.subheading.personalInformation"
        fallback="Personal information"
      />
    ),
    fields: GENERIC_ADDITIONAL_DATA_FIELDS.PERSONAL,
  },
  {
    sectionKey: 'otherInformation',
    title: (
      <TranslatedText
        stringId="patient.details.subheading.otherInformation"
        fallback="Other information"
      />
    ),
    fields: GENERIC_ADDITIONAL_DATA_FIELDS.OTHER,
  },
  {
    sectionKey: 'otherWithHierarchy',
    title: (
      <TranslatedText
        stringId="patient.details.subheading.otherInformation"
        fallback="Other information"
      />
    ),
    fields: GENERIC_ADDITIONAL_DATA_FIELDS.OTHER_WITH_HIERARCHY,
  },
];
