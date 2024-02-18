import React from 'react';

import { PATIENT_REGISTRY_TYPES, MARITAL_STATUS_OPTIONS } from '@tamanu/constants';

import { AutocompleteField, BaseSelectField, SuggesterSelectField, TextField } from '..';
import {
  bloodOptions,
  educationalAttainmentOptions,
  socialMediaOptions,
  titleOptions,
} from '../../constants';
import { usePatientSuggester, useSuggester } from '../../api';
import { ConfiguredMandatoryPatientFields } from './ConfiguredMandatoryPatientFields';
import { TranslatedText } from '../Translation/TranslatedText';

export const PersonalInformationFields = ({ patientRegistryType, showMandatory }) => {
  const countrySuggester = useSuggester('country');
  const ethnicitySuggester = useSuggester('ethnicity');
  const nationalitySuggester = useSuggester('nationality');
  const occupationSuggester = useSuggester('occupation');
  const religionSuggester = useSuggester('religion');
  const patientSuggester = usePatientSuggester();

  const PERSONAL_INFORMATION_FIELDS = {
    title: {
      component: BaseSelectField,
      options: titleOptions,
      label: <TranslatedText stringId="general.localisedField.title.label" fallback="Title" />,
    },
    maritalStatus: {
      component: BaseSelectField,
      options: MARITAL_STATUS_OPTIONS,
      condition: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT,
      label: (
        <TranslatedText
          stringId="general.localisedField.maritalStatus.label"
          fallback="Marital status"
        />
      ),
    },
    bloodType: {
      component: BaseSelectField,
      options: bloodOptions,
      label: (
        <TranslatedText stringId="general.localisedField.bloodType.label" fallback="Blood type" />
      ),
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
      component: BaseSelectField,
      options: educationalAttainmentOptions,
      condition: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT,
      label: (
        <TranslatedText
          stringId="general.localisedField.educationalLevel.label"
          fallback="Educational attainment"
        />
      ),
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
      component: BaseSelectField,
      options: socialMediaOptions,
      condition: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT,
      label: (
        <TranslatedText
          stringId="general.localisedField.socialMedia.label"
          fallback="Social media"
        />
      ),
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
      fields={PERSONAL_INFORMATION_FIELDS}
      showMandatory={showMandatory}
    />
  );
};
