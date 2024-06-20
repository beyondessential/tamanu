import React from 'react';
import { TranslatedText } from '/components/Translations/TranslatedText';
import { ADDITIONAL_DATA_FIELDS } from '~/ui/helpers/additionalData';

export const CAMBODIA_CUSTOM_FIELDS = {
  NATIONAL_ID: 'fieldDefinition-nationalId',
  ID_POOR_CARD_NUMBER: 'fieldDefinition-idPoorCardNumber',
  PMRS_NUMBER: 'fieldDefinition-pmrsNumber',
  FATHERS_FIRST_NAME: 'fieldDefinition-fathersFirstName',
  SECONDARY_STREET_ADDRESS: 'fieldDefinition-secondaryAddressStreet',
};

// Cambodia data layout
export const CAMBODIA_ADDITIONAL_DATA_FIELDS = {
  ADDRESS: ['cambodiaVillageId', ADDITIONAL_DATA_FIELDS.STREET_VILLAGE],
  PERMANENT_ADDRESS: [
    'cambodiaSecondaryVillageId',
    CAMBODIA_CUSTOM_FIELDS.SECONDARY_STREET_ADDRESS,
  ],
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
    sectionKey: 'currentAddress',
    title: (
      <TranslatedText
        stringId="patient.details.subheading.currentAddress"
        fallback="Current address"
      />
    ),
    fields: CAMBODIA_ADDITIONAL_DATA_FIELDS.ADDRESS,
    dataFields: [
      'divisionId',
      'subdivisionId',
      'settlementId',
      'villageId',
      ADDITIONAL_DATA_FIELDS.STREET_VILLAGE,
    ],
  },
  {
    sectionKey: 'permanentAddress',
    title: (
      <TranslatedText
        stringId="patient.details.subheading.permanentAddress"
        fallback="Permanent address"
      />
    ),
    fields: CAMBODIA_ADDITIONAL_DATA_FIELDS.PERMANENT_ADDRESS,
    dataFields: [
      'secondaryDivisionId',
      'secondarySubdivisionId',
      'secondarySettlementId',
      'secondaryVillageId',
      CAMBODIA_CUSTOM_FIELDS.SECONDARY_STREET_ADDRESS,
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
    fields: CAMBODIA_ADDITIONAL_DATA_FIELDS.CONTACT,
  },
  {
    sectionKey: 'identificationInformation',
    title: (
      <TranslatedText
        stringId="patient.details.subheading.identificationInformation"
        fallback="Identification information"
      />
    ),
    fields: CAMBODIA_ADDITIONAL_DATA_FIELDS.IDENTIFICATION,
  },
  {
    sectionKey: 'personalInformation',
    title: (
      <TranslatedText
        stringId="patient.details.subheading.personalInformation"
        fallback="Personal information"
      />
    ),
    fields: CAMBODIA_ADDITIONAL_DATA_FIELDS.PERSONAL,
  },
];
