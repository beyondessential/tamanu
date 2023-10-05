import React from 'react';

import { PATIENT_REGISTRY_TYPES } from '@tamanu/constants';

import { AutocompleteField, SelectField, SuggesterSelectField, TextField } from '..';
import {
  bloodOptions,
  educationalAttainmentOptions,
  maritalStatusOptions,
  socialMediaOptions,
  titleOptions,
} from '../../constants';
import { useSuggester } from '../../api';
import { ConfiguredMandatoryPatientFields } from './ConfiguredMandatoryPatientFields';

export const PersonalInformationFields = ({ patientRegistryType, showMandatory }) => {
  const countrySuggester = useSuggester('country');
  const ethnicitySuggester = useSuggester('ethnicity');
  const nationalitySuggester = useSuggester('nationality');
  const occupationSuggester = useSuggester('occupation');
  const religionSuggester = useSuggester('religion');

  const PERSONAL_INFORMATION_FIELDS = {
    title: {
      component: SelectField,
      options: titleOptions,
    },
    maritalStatus: {
      component: SelectField,
      options: maritalStatusOptions,
      condition: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT,
    },
    bloodType: {
      component: SelectField,
      options: bloodOptions,
    },
    placeOfBirth: {
      component: TextField,
    },
    countryOfBirthId: {
      component: AutocompleteField,
      suggester: countrySuggester,
    },
    nationalityId: {
      component: AutocompleteField,
      suggester: nationalitySuggester,
    },
    ethnicityId: {
      component: AutocompleteField,
      suggester: ethnicitySuggester,
    },
    religionId: {
      component: AutocompleteField,
      suggester: religionSuggester,
    },
    educationalLevel: {
      component: SelectField,
      options: educationalAttainmentOptions,
    },
    occupationId: { component: AutocompleteField, suggester: occupationSuggester },
    socialMedia: { component: SelectField, options: socialMediaOptions },
    patientBillingTypeId: {
      component: SuggesterSelectField,
      endpoint: 'patientBillingType',
    },
    motherId: {
      component: AutocompleteField,
      endpoint: 'patientSuggester',
    },
    fatherId: {
      component: AutocompleteField,
      endpoint: 'patientSuggester',
    },
  };

  return (
    <ConfiguredMandatoryPatientFields
      fields={PERSONAL_INFORMATION_FIELDS}
      showMandatory={showMandatory}
    />
  );
};
