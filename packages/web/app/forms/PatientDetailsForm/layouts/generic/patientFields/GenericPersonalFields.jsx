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
  const motherSuggester = usePatientSuggester();
  const fatherSuggester = usePatientSuggester();

  const PERSONAL_FIELDS = {
    title: {
      component: TranslatedSelectField,
      enumValues: TITLE_LABELS,
      label: (
        <TranslatedText
          stringId="general.localisedField.title.label"
          fallback="Title"
          data-testid="translatedtext-04t0"
        />
      ),
    },
    maritalStatus: {
      component: TranslatedSelectField,
      enumValues: MARTIAL_STATUS_LABELS,
      condition: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT || isEdit,
      label: (
        <TranslatedText
          stringId="general.localisedField.maritalStatus.label"
          fallback="Marital status"
          data-testid="translatedtext-11e7"
        />
      ),
    },
    bloodType: {
      component: TranslatedSelectField,
      enumValues: BLOOD_LABELS,
      label: (
        <TranslatedText
          stringId="general.localisedField.bloodType.label"
          fallback="Blood type"
          data-testid="translatedtext-86gf"
        />
      ),
    },
    placeOfBirth: {
      component: TextField,
      label: (
        <TranslatedText
          stringId="general.localisedField.placeOfBirth.label"
          fallback="Birth location"
          data-testid="translatedtext-w8zz"
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
          data-testid="translatedtext-hd45"
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
          data-testid="translatedtext-tyz8"
        />
      ),
    },
    ethnicityId: {
      component: AutocompleteField,
      suggester: ethnicitySuggester,
      label: (
        <TranslatedText
          stringId="general.localisedField.ethnicityId.label"
          fallback="Ethnicity"
          data-testid="translatedtext-ulov"
        />
      ),
    },
    religionId: {
      component: AutocompleteField,
      suggester: religionSuggester,
      label: (
        <TranslatedText
          stringId="general.localisedField.religionId.label"
          fallback="Religion"
          data-testid="translatedtext-d9i5"
        />
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
          data-testid="translatedtext-a309"
        />
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
          data-testid="translatedtext-77f1"
        />
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
          data-testid="translatedtext-g406"
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
          data-testid="translatedtext-c6cp"
        />
      ),
    },
    motherId: {
      component: AutocompleteField,
      suggester: motherSuggester,
      label: (
        <TranslatedText
          stringId="general.localisedField.motherId.label"
          fallback="Mother"
          data-testid="translatedtext-w3cn"
        />
      ),
    },
    fatherId: {
      component: AutocompleteField,
      suggester: fatherSuggester,
      label: (
        <TranslatedText
          stringId="general.localisedField.fatherId.label"
          fallback="Father"
          data-testid="translatedtext-q3v5"
        />
      ),
    },
  };

  return (
    <ConfiguredMandatoryPatientFields
      fields={PERSONAL_FIELDS}
      filterByMandatory={filterByMandatory}
      data-testid="configuredmandatorypatientfields-vhzu"
    />
  );
};
