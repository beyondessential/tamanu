import React from 'react';
import { TranslatedText } from '/components/Translations/TranslatedText';
import { ADDITIONAL_DATA_FIELDS } from '~/ui/helpers/additionalData';

export const ADDITIONAL_DATA_SECTIONS = [
  {
    sectionKey: 'identificationInformation',
    title: (
      <TranslatedText
        stringId="patient.details.subheading.identificationInformation"
        fallback="Identification information"
      />
    ),
    fields: [
      ADDITIONAL_DATA_FIELDS.BIRTH_CERTIFICATE,
      ADDITIONAL_DATA_FIELDS.DRIVING_LICENSE,
      ADDITIONAL_DATA_FIELDS.PASSPORT,
    ],
  },
  {
    sectionKey: 'contactInformation',
    title: (
      <TranslatedText
        stringId="patient.details.subheading.contactInformation"
        fallback="Contact information"
      />
    ),
    fields: [
      ADDITIONAL_DATA_FIELDS.PRIMARY_CONTACT_NUMBER,
      ADDITIONAL_DATA_FIELDS.SECONDARY_CONTACT_NUMBER,
      ADDITIONAL_DATA_FIELDS.EMERGENCY_CONTACT_NAME,
      ADDITIONAL_DATA_FIELDS.EMERGENCY_CONTACT_NUMBER,
    ],
  },
  {
    sectionKey: 'personalInformation',
    title: (
      <TranslatedText
        stringId="patient.details.subheading.personalInformation"
        fallback="Personal information"
      />
    ),
    fields: [
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
  },
  {
    sectionKey: 'otherInformation',
    title: (
      <TranslatedText
        stringId="patient.details.subheading.otherInformation"
        fallback="Other information"
      />
    ),
    fields: [
      ADDITIONAL_DATA_FIELDS.STREET_VILLAGE,
      ADDITIONAL_DATA_FIELDS.CITY_TOWN,
      ADDITIONAL_DATA_FIELDS.SUBDIVISION_ID,
      ADDITIONAL_DATA_FIELDS.DIVISION_ID,
      ADDITIONAL_DATA_FIELDS.COUNTRY_ID,
      ADDITIONAL_DATA_FIELDS.SETTLEMENT_ID,
      ADDITIONAL_DATA_FIELDS.MEDICAL_AREA_ID,
      ADDITIONAL_DATA_FIELDS.NURSING_ZONE_ID,
    ],
  },
];
