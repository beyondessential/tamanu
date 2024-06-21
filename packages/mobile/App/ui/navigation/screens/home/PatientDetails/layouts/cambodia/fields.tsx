import React from 'react';
import { TranslatedText } from '/components/Translations/TranslatedText';
import { ADDITIONAL_DATA_FIELDS } from '~/ui/helpers/additionalData';
import { PATIENT_DATA_FIELDS } from '/helpers/patient';
import { ReferenceDataType } from '~/types';
import { labels } from '/navigation/screens/home/PatientDetails/layouts/generic/labels';

export const CAMBODIA_CUSTOM_FIELDS = {
  NATIONAL_ID: 'fieldDefinition-nationalId',
  ID_POOR_CARD_NUMBER: 'fieldDefinition-idPoorCardNumber',
  PMRS_NUMBER: 'fieldDefinition-pmrsNumber',
  FATHERS_FIRST_NAME: 'fieldDefinition-fathersFirstName',
  SECONDARY_STREET_ADDRESS: 'fieldDefinition-secondaryAddressStreet',
};

export const CAMBODIA_LOCATION_HIERARCHY_FIELD_IDS = [
  'cambodiaVillageId',
  'cambodiaSecondaryVillageId',
];

export const CAMBODIA_LOCATION_HIERARCHY_FIELDS = [
  {
    name: 'divisionId',
    referenceType: ReferenceDataType.Division,
    label: <TranslatedText stringId="cambodiaPatientDetails.province.label" fallback="Province" />,
  },
  {
    name: 'subdivisionId',
    referenceType: ReferenceDataType.SubDivision,
    label: <TranslatedText stringId="cambodiaPatientDetails.district.label" fallback="District" />,
  },
  {
    name: 'settlementId',
    referenceType: ReferenceDataType.Settlement,
    label: <TranslatedText stringId="cambodiaPatientDetails.commune.label" fallback="Commune" />,
  },
  {
    name: 'villageId',
    referenceType: ReferenceDataType.Village,
    label: <TranslatedText stringId="general.localisedField.villageId.label" fallback="Village" />,
  },
];

export const SECONDARY_LOCATION_HIERARCHY_FIELDS = [
  {
    name: 'secondaryDivisionId',
    referenceType: ReferenceDataType.Division,
    label: labels.secondaryDivisionId,
  },
  {
    name: 'secondarySubdivisionId',
    referenceType: ReferenceDataType.SubDivision,
    label: labels.secondarySubdivisionId,
  },
  {
    name: 'secondarySettlementId',
    referenceType: ReferenceDataType.Settlement,
    label: labels.secondarySettlementId,
  },
  {
    name: 'secondaryVillageId',
    referenceType: ReferenceDataType.Village,
    label: labels.secondaryVillageId,
  },
];

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
      ADDITIONAL_DATA_FIELDS.DIVISION_ID,
      ADDITIONAL_DATA_FIELDS.SUBDIVISION_ID,
      ADDITIONAL_DATA_FIELDS.SETTLEMENT_ID,
      PATIENT_DATA_FIELDS.VILLAGE_ID,
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
      ADDITIONAL_DATA_FIELDS.SECONDARY_VILLAGE_ID,
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
