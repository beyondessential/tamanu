import React from 'react';
import { TranslatedText } from '/components/Translations/TranslatedText';
import { ADDITIONAL_DATA_FIELDS } from '~/ui/helpers/additionalData';
import { PATIENT_DATA_FIELDS } from '/helpers/patient';
import { ReferenceDataType } from '~/types';
import { keyBy } from 'lodash';

export const CAMBODIA_CUSTOM_FIELDS = {
  NATIONAL_ID: 'fieldDefinition-nationalId',
  ID_POOR_CARD_NUMBER: 'fieldDefinition-idPoorCardNumber',
  PMRS_NUMBER: 'fieldDefinition-pmrsNumber',
  FATHERS_FIRST_NAME: 'fieldDefinition-fathersFirstName',
  SECONDARY_STREET_ADDRESS: 'fieldDefinition-secondaryAddressStreet',
};

export const CAMBODIA_LOCATION_HIERARCHY_FIELD_IDS = {
  VILLAGE_ID: 'cambodiaVillageId',
  SECONDARY_VILLAGE_ID: 'cambodiaSecondaryVillageId',
};

export const CAMBODIA_LOCATION_HIERARCHY_FIELDS = [
  {
    name: ADDITIONAL_DATA_FIELDS.DIVISION_ID,
    referenceType: ReferenceDataType.Division,
    label: <TranslatedText stringId="cambodiaPatientDetails.province.label" fallback="Province" />,
  },
  {
    name: ADDITIONAL_DATA_FIELDS.SUBDIVISION_ID,
    referenceType: ReferenceDataType.SubDivision,
    label: <TranslatedText stringId="cambodiaPatientDetails.district.label" fallback="District" />,
  },
  {
    name: ADDITIONAL_DATA_FIELDS.SETTLEMENT_ID,
    referenceType: ReferenceDataType.Settlement,
    label: <TranslatedText stringId="cambodiaPatientDetails.commune.label" fallback="Commune" />,
  },
  {
    name: PATIENT_DATA_FIELDS.VILLAGE_ID,
    referenceType: ReferenceDataType.Village,
    label: <TranslatedText stringId="general.localisedField.villageId.label" fallback="Village" />,
  },
];

// Note can't re-use the labels from the generic layout as it triggers a circular dependency error
export const SECONDARY_LOCATION_HIERARCHY_FIELDS = [
  {
    name: 'secondaryDivisionId',
    referenceType: ReferenceDataType.Division,
    label: <TranslatedText stringId="cambodiaPatientDetails.province.label" fallback="Province" />,
  },
  {
    name: 'secondarySubdivisionId',
    referenceType: ReferenceDataType.SubDivision,
    label: <TranslatedText stringId="cambodiaPatientDetails.district.label" fallback="District" />,
  },
  {
    name: 'secondarySettlementId',
    referenceType: ReferenceDataType.Settlement,
    label: <TranslatedText stringId="cambodiaPatientDetails.commune.label" fallback="Commune" />,
  },
  {
    name: 'secondaryVillageId',
    referenceType: ReferenceDataType.Village,
    label: <TranslatedText stringId="general.localisedField.villageId.label" fallback="Village" />,
  },
];

// For a given secondary village id, get the hierarchy data
export const getSecondaryVillageData = async (models, secondaryVillageId) => {
  const data = {};
  const entity = await models.ReferenceData.getNode({
    id: secondaryVillageId,
  });
  const ancestors = await entity?.getAncestors();
  const hierarchy = [...ancestors, entity];

  if (!entity || !hierarchy) {
    return data;
  }

  const hierarchyByType = keyBy(hierarchy, 'type');
  data['secondaryDivisionId'] = hierarchyByType['division']?.id;
  data['secondaryDivision'] = hierarchyByType['division'];
  data['secondarySubdivisionId'] = hierarchyByType['subdivision']?.id;
  data['secondarySubdivision'] = hierarchyByType['subdivision'];
  data['secondarySettlementId'] = hierarchyByType['settlement']?.id;
  data['secondarySettlement'] = hierarchyByType['settlement'];
  return data;
};

// Cambodia data layout
export const CAMBODIA_ADDITIONAL_DATA_FIELDS = {
  ADDRESS: [
    CAMBODIA_LOCATION_HIERARCHY_FIELD_IDS.VILLAGE_ID,
    ADDITIONAL_DATA_FIELDS.STREET_VILLAGE,
  ],
  PERMANENT_ADDRESS: [
    CAMBODIA_LOCATION_HIERARCHY_FIELD_IDS.SECONDARY_VILLAGE_ID,
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
