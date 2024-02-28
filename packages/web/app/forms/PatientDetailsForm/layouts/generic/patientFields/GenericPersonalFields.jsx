import React from 'react';

import { PATIENT_REGISTRY_TYPES, MARITAL_STATUS_OPTIONS } from '@tamanu/constants';
import {
  SelectField,
  TextField,
  AutocompleteField,
  SuggesterSelectField,
} from '../../../../../components';
import {
  BLOOD_OPTIONS,
  EDUCATIONAL_ATTAINMENT_OPTIONS,
  SOCIAL_MEDIA_OPTIONS,
  TITLE_OPTIONS,
} from '../../../../../constants';
import { ConfiguredMandatoryPatientFields } from '../../../ConfiguredMandatoryPatientFields';
import { useSuggester, usePatientSuggester } from '../../../../../api';
import { TranslatedText } from '../../../../../components/Translation/TranslatedText';

export const GenericPersonalFields = ({ patientRegistryType, filterByMandatory }) => {
  const countrySuggester = useSuggester('country');
  const ethnicitySuggester = useSuggester('ethnicity');
  const nationalitySuggester = useSuggester('nationality');
  const occupationSuggester = useSuggester('occupation');
  const religionSuggester = useSuggester('religion');
  const patientSuggester = usePatientSuggester();

  const PERSONAL_FIELDS = {
    title: {
      component: SelectField,
      options: TITLE_OPTIONS,
      label: <TranslatedText stringId="general.localisedField.title.label" fallback="Title" />,
      prefix: 'localisedField.property.title',
    },
    maritalStatus: {
      component: SelectField,
      options: MARITAL_STATUS_OPTIONS,
      condition: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT,
      label: (
        <TranslatedText
          stringId="general.localisedField.maritalStatus.label"
          fallback="Marital status"
        />
      ),
      prefix: 'localisedField.property.maritalStatus',
    },
    bloodType: {
      component: SelectField,
      options: BLOOD_OPTIONS,
      label: (
        <TranslatedText stringId="general.localisedField.bloodType.label" fallback="Blood type" />
      ),
      prefix: 'localisedField.property.bloodType',
    },
    placeOfBirth: {
      component: TextField,
      label: (
        <TranslatedText
          stringId="general.localisedField.placeOfBirth.label"
          fallback="Birth location"
        />
      ),
    },
    countryOfBirthId: {
      component: AutocompleteField,
      suggester: countrySuggester,
      label: (
        <TranslatedText
          stringId="general.localisedField.countryOfBirthId.label"
          fallback="Country of birth"
        />
      ),
    },
    nationalityId: {
      component: AutocompleteField,
      suggester: nationalitySuggester,
      label: (
        <TranslatedText
          stringId="general.localisedField.nationalityId.label"
          fallback="Nationality"
        />
      ),
    },
    ethnicityId: {
      component: AutocompleteField,
      suggester: ethnicitySuggester,
      label: (
        <TranslatedText stringId="general.localisedField.ethnicityId.label" fallback="Ethnicity" />
      ),
    },
    religionId: {
      component: AutocompleteField,
      suggester: religionSuggester,
      label: (
        <TranslatedText stringId="general.localisedField.religionId.label" fallback="Religion" />
      ),
    },
    educationalLevel: {
      component: SelectField,
      options: EDUCATIONAL_ATTAINMENT_OPTIONS,
      condition: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT,
      label: (
        <TranslatedText
          stringId="general.localisedField.educationalLevel.label"
          fallback="Educational attainment"
        />
      ),
      prefix: 'localisedField.property.educationalLevel',
    },
    occupationId: {
      component: AutocompleteField,
      suggester: occupationSuggester,
      condition: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT,
      label: (
        <TranslatedText
          stringId="general.localisedField.occupationId.label"
          fallback="Occupation"
        />
      ),
    },
    socialMedia: {
      component: SelectField,
      options: SOCIAL_MEDIA_OPTIONS,
      condition: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT,
      label: (
        <TranslatedText
          stringId="general.localisedField.socialMedia.label"
          fallback="Social media"
        />
      ),
      prefix: 'localisedField.property.socialMedia',
    },
    patientBillingTypeId: {
      component: SuggesterSelectField,
      endpoint: 'patientBillingType',
      label: (
        <TranslatedText
          stringId="general.localisedField.patientBillingTypeId.label"
          fallback="Patient type"
        />
      ),
    },
    motherId: {
      component: AutocompleteField,
      suggester: patientSuggester,
      label: <TranslatedText stringId="general.localisedField.motherId.label" fallback="Mother" />,
    },
    fatherId: {
      component: AutocompleteField,
      suggester: patientSuggester,
      label: <TranslatedText stringId="general.localisedField.fatherId.label" fallback="Father" />,
    },
  };

  return (
    <ConfiguredMandatoryPatientFields
      fields={PERSONAL_FIELDS}
      filterByMandatory={filterByMandatory}
    />
  );
};
