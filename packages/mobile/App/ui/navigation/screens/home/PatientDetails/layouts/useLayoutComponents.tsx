import { CambodiaGeneralInfo } from './cambodia/CambodiaGeneralInfo';
import { CambodiaAdditionalInfo } from './cambodia/CambodiaAdditionalInfo';

import { GeneralInfo } from './generic/GeneralInfo';
import { AdditionalInfo } from './generic/AdditionalInfo';

import { useLocalisation } from '~/ui/contexts/LocalisationContext';
import { formatStringDate } from '~/ui/helpers/date';
import { DateFormats } from '~/ui/helpers/constants';
import { getGender } from '~/ui/helpers/user';

const PATIENT_DETAIL_LAYOUTS = {
  GENERIC: 'generic',
  CAMBODIA: 'cambodia',
};

export const BASIC_PATIENT_FIELDS = {
  LAST_NAME: 'lastName',
  FIRST_NAME: 'firstName',
  DATE_OF_BIRTH: 'dateOfBirth',
  SEX: 'sex',
  CULTURAL_NAME: 'culturalName',
  VILLAGE_ID: 'villageId',
};

export const PAD_PATIENT_FIELDS = {
  DIVISION_ID: 'divisionId',
  SUBDIVISION_ID: 'subdivisionId',
  SETTLEMENT_ID: 'settlementId',
  STREET_VILLAGE: 'streetVillage',
  PRIMARY_CONTACT_NUMBER: 'primaryContactNumber',
  SECONDARY_CONTACT_NUMBER: 'secondaryContactNumber',
  EMERGENCY_CONTACT_NAME: 'emergencyContactName',
  EMERGENCY_CONTACT_NUMBER: 'emergencyContactNumber',
  MEDICAL_AREA_ID: 'medicalAreaId',
  NURSING_ZONE_ID: 'nursingZoneId',
  BIRTH_CERTIFICATE: 'birthCertificate',
  NATIONAL_ID: 'nationalId',
  PASSPORT: 'passport',
  ID_POOR_CARD_NUMBER: 'idPoorCardNumber',
  PMRS_NUMBER: 'pmrsNumber',
  COUNTRY_OF_BIRTH_ID: 'countryOfBirthId',
};

export const DEFAULT_FIELDS = {
  general: [],
  pad: [],
};

export const CAMBODIA_CUSTOM_FIELD_DEFINITION_IDS = {
  NATIONAL_ID: 'fieldDefinition-nationalId',
  ID_POOR_CARD_NUMBER: 'fieldDefinition-idPoorCardNumber',
  PMRS_NUMBER: 'fieldDefinition-pmrsNumber',
  FATHERS_FIRST_NAME: 'fieldDefinition-fathersFirstName',
};

const getCustomFieldValue = (customPatientFieldValues = {}, fieldDefinitionId) => {
  return customPatientFieldValues[fieldDefinitionId][0].value;
};

export const CAMBODIA_FIELDS = {
  GENERAL: {
    title: 'General Information',
    fields: [
      { name: 'lastName' },
      { name: 'firstName' },
      {
        name: 'dateOfBirth',
        accessor: ({ patient }) => formatStringDate(patient.dateOfBirth, DateFormats.DDMMYY),
      },
      { name: 'sex', accessor: ({ patient }) => getGender(patient.sex) },
      {
        name: 'fathersFirstName',
        accessor: ({ customPatientFieldValues, loading }) =>
          !loading
            ? getCustomFieldValue(
                customPatientFieldValues,
                CAMBODIA_CUSTOM_FIELD_DEFINITION_IDS.FATHERS_FIRST_NAME,
              )
            : '',
      },
      { name: 'culturalName' },
    ],
  },
  PAD: [
    {
      title: 'Current address',
      fields: ['divisionId', 'subdivisionId', 'settlementId', 'villageId', 'streetVillage'],
    },
    {
      title: 'Contact information',
      fields: [
        'primaryContactNumber',
        'secondaryContactNumber',
        'emergencyContactName',
        'emergencyContactNumber',
        'medicalAreaId',
        'nursingZoneId',
      ],
    },
    {
      title: 'Identification information',
      fields: [
        'birthCertificate',
        'fieldDefinition-nationalId',
        'passport',
        'fieldDefinition-idPoorCardNumber',
        'fieldDefinition-pmrsNumber',
      ],
    },
    {
      title: 'Personal information',
      fields: ['countryOfBirthId', 'nationalityId'],
    },
  ],
};

const LAYOUT_COMPONENTS = {
  [PATIENT_DETAIL_LAYOUTS.GENERIC]: {
    GeneralInfo: GeneralInfo,
    AdditionalInfo: AdditionalInfo,
    fields: BASIC_PATIENT_FIELDS,
  },
  [PATIENT_DETAIL_LAYOUTS.CAMBODIA]: {
    GeneralInfo: CambodiaGeneralInfo,
    AdditionalInfo: CambodiaAdditionalInfo,
    fields: CAMBODIA_FIELDS,
  },
};

export const useLayoutComponents = () => {
  const { getLocalisation } = useLocalisation();
  const layout = getLocalisation('layouts.patientDetails') || PATIENT_DETAIL_LAYOUTS.GENERIC;
  return LAYOUT_COMPONENTS[layout];
};
