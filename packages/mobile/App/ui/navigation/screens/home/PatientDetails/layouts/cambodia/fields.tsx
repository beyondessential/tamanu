import React from 'react';
import { TranslatedText } from '/components/Translations/TranslatedText';
import { ADDITIONAL_DATA_FIELDS } from '~/ui/helpers/additionalData';

export const CAMBODIA_CUSTOM_FIELDS = {
  NATIONAL_ID: 'fieldDefinition-nationalId',
  ID_POOR_CARD_NUMBER: 'fieldDefinition-idPoorCardNumber',
  PMRS_NUMBER: 'fieldDefinition-pmrsNumber',
  FATHERS_FIRST_NAME: 'fieldDefinition-fathersFirstName',
};

// Cambodia data layout
export const CAMBODIA_ADDITIONAL_DATA_FIELDS = {
  ADDRESS: ['cambodiaVillageId', ADDITIONAL_DATA_FIELDS.STREET_VILLAGE],
  PERMANENT_ADDRESS: ['cambodiaSecondaryVillageId'],
  CONTACT: [
    ADDITIONAL_DATA_FIELDS.PRIMARY_CONTACT_NUMBER,
    ADDITIONAL_DATA_FIELDS.SECONDARY_CONTACT_NUMBER,
    ADDITIONAL_DATA_FIELDS.EMERGENCY_CONTACT_NAME,
    ADDITIONAL_DATA_FIELDS.EMERGENCY_CONTACT_NUMBER,
    ADDITIONAL_DATA_FIELDS.MEDICAL_AREA_ID,
    ADDITIONAL_DATA_FIELDS.NURSING_ZONE_ID,
  ],
  IDENTIFICATION: [
    ADDITIONAL_DATA_FIELDS.BIRTH_CERTIFICATE,
    ADDITIONAL_DATA_FIELDS.PASSPORT,
    CAMBODIA_CUSTOM_FIELDS.NATIONAL_ID,
    CAMBODIA_CUSTOM_FIELDS.ID_POOR_CARD_NUMBER,
    CAMBODIA_CUSTOM_FIELDS.PMRS_NUMBER,
  ],
  PERSONAL: [ADDITIONAL_DATA_FIELDS.COUNTRY_OF_BIRTH_ID, ADDITIONAL_DATA_FIELDS.NATIONALITY_ID],
};

export const CAMBODIA_ADDITIONAL_DATA_SECTIONS = [
  {
    title: (
      <TranslatedText
        stringId="patient.details.subheading.currentAddress"
        fallback="Current address"
      />
    ),
    fields: CAMBODIA_ADDITIONAL_DATA_FIELDS.ADDRESS,
  },
  {
    title: (
      <TranslatedText
        stringId="patient.details.subheading.permanentAddress"
        fallback="Permanent address"
      />
    ),
    fields: CAMBODIA_ADDITIONAL_DATA_FIELDS.PERMANENT_ADDRESS,
  },
  {
    title: (
      <TranslatedText
        stringId="patient.details.subheading.contactInformation"
        fallback="Contact information"
      />
    ),
    fields: CAMBODIA_ADDITIONAL_DATA_FIELDS.CONTACT,
  },
  {
    title: (
      <TranslatedText
        stringId="patient.details.subheading.identificationInformation"
        fallback="Identification information"
      />
    ),
    fields: CAMBODIA_ADDITIONAL_DATA_FIELDS.IDENTIFICATION,
  },
  {
    title: (
      <TranslatedText
        stringId="patient.details.subheading.personalInformation"
        fallback="Personal information"
      />
    ),
    fields: CAMBODIA_ADDITIONAL_DATA_FIELDS.PERSONAL,
  },
];
