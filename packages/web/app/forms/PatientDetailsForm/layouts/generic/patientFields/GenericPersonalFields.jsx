import React from 'react';

import {
  PATIENT_REGISTRY_TYPES,
  MARTIAL_STATUS_LABELS,
  BLOOD_LABELS,
  EDUCATIONAL_ATTAINMENT_LABELS,
  SOCIAL_MEDIA_LABELS,
  TITLE_LABELS,
} from '@tamanu/constants';

import {
  TextField,
  AutocompleteField,
  SuggesterSelectField,
  TranslatedSelectField,
} from '../../../../../components';
import { ConfiguredMandatoryPatientFields } from '../../../ConfiguredMandatoryPatientFields';
import { usePatientSuggester, useSuggester } from '../../../../../api';
import { TranslatedText } from '../../../../../components/Translation/TranslatedText';

export const GenericPersonalFields = ({ patientRegistryType, filterByMandatory, isEdit }) => {
  const countrySuggester = useSuggester('country');
  const ethnicitySuggester = useSuggester('ethnicity');
  const nationalitySuggester = useSuggester('nationality');
  const occupationSuggester = useSuggester('occupation');
  const religionSuggester = useSuggester('religion');
  const patientSuggester = usePatientSuggester();

  const PERSONAL_FIELDS = {
    title: {
      component: TranslatedSelectField,
      enumValues: TITLE_LABELS,
      label: <TranslatedText
        stringId="general.localisedField.title.label"
        fallback="Title"
        data-testid='translatedtext-6i2v' />,
    },
    maritalStatus: {
      component: TranslatedSelectField,
      enumValues: MARTIAL_STATUS_LABELS,
      condition: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT || isEdit,
      label: (
        <TranslatedText
          stringId="general.localisedField.maritalStatus.label"
          fallback="Marital status"
          data-testid='translatedtext-7fsl' />
      ),
    },
    bloodType: {
      component: TranslatedSelectField,
      enumValues: BLOOD_LABELS,
      label: (
        <TranslatedText
          stringId="general.localisedField.bloodType.label"
          fallback="Blood type"
          data-testid='translatedtext-xtyz' />
      ),
    },
    placeOfBirth: {
      component: TextField,
      label: (
        <TranslatedText
          stringId="general.localisedField.placeOfBirth.label"
          fallback="Birth location"
          data-testid='translatedtext-648h' />
      ),
    },
    countryOfBirthId: {
      component: AutocompleteField,
      suggester: countrySuggester,
      label: (
        <TranslatedText
          stringId="general.localisedField.countryOfBirthId.label"
          fallback="Country of birth"
          data-testid='translatedtext-kdl1' />
      ),
    },
    nationalityId: {
      component: AutocompleteField,
      suggester: nationalitySuggester,
      label: (
        <TranslatedText
          stringId="general.localisedField.nationalityId.label"
          fallback="Nationality"
          data-testid='translatedtext-hy5h' />
      ),
    },
    ethnicityId: {
      component: AutocompleteField,
      suggester: ethnicitySuggester,
      label: (
        <TranslatedText
          stringId="general.localisedField.ethnicityId.label"
          fallback="Ethnicity"
          data-testid='translatedtext-06tk' />
      ),
    },
    religionId: {
      component: AutocompleteField,
      suggester: religionSuggester,
      label: (
        <TranslatedText
          stringId="general.localisedField.religionId.label"
          fallback="Religion"
          data-testid='translatedtext-3si2' />
      ),
    },
    educationalLevel: {
      component: TranslatedSelectField,
      enumValues: EDUCATIONAL_ATTAINMENT_LABELS,
      condition: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT || isEdit,
      label: (
        <TranslatedText
          stringId="general.localisedField.educationalLevel.label"
          fallback="Educational attainment"
          data-testid='translatedtext-6j9w' />
      ),
    },
    occupationId: {
      component: AutocompleteField,
      suggester: occupationSuggester,
      condition: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT || isEdit,
      label: (
        <TranslatedText
          stringId="general.localisedField.occupationId.label"
          fallback="Occupation"
          data-testid='translatedtext-q6cf' />
      ),
    },
    socialMedia: {
      component: TranslatedSelectField,
      enumValues: SOCIAL_MEDIA_LABELS,
      condition: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT || isEdit,
      label: (
        <TranslatedText
          stringId="general.localisedField.socialMedia.label"
          fallback="Social media"
          data-testid='translatedtext-jbsu' />
      ),
    },
    patientBillingTypeId: {
      component: SuggesterSelectField,
      endpoint: 'patientBillingType',
      label: (
        <TranslatedText
          stringId="general.localisedField.patientBillingTypeId.label"
          fallback="Patient type"
          data-testid='translatedtext-9y03' />
      ),
    },
    motherId: {
      component: AutocompleteField,
      suggester: patientSuggester,
      label: <TranslatedText
        stringId="general.localisedField.motherId.label"
        fallback="Mother"
        data-testid='translatedtext-kaiy' />,
    },
    fatherId: {
      component: AutocompleteField,
      suggester: patientSuggester,
      label: <TranslatedText
        stringId="general.localisedField.fatherId.label"
        fallback="Father"
        data-testid='translatedtext-1vec' />,
    },
  };

  return (
    <ConfiguredMandatoryPatientFields
      fields={PERSONAL_FIELDS}
      filterByMandatory={filterByMandatory}
    />
  );
};
