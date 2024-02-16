import React from 'react';

import { PATIENT_REGISTRY_TYPES, MARITAL_STATUS_OPTIONS } from '@tamanu/constants';

import {
  bloodOptions,
  educationalAttainmentOptions,
  socialMediaOptions,
  titleOptions,
} from '../../../../../constants';
import {
  SelectField,
  TextField,
  AutocompleteField,
  SuggesterSelectField,
} from '../../../../../components';
import { ConfiguredMandatoryPatientFields } from '../../../../../components/ConfiguredMandatoryPatientFields';

export const GenericPersonalFields = ({
  patientRegistryType,
  countrySuggester,
  ethnicitySuggester,
  nationalitySuggester,
  occupationSuggester,
  religionSuggester,
  patientSuggester,
  filterByMandatory
}) => {
  const PERSONAL_FIELDS = {
    title: {
      component: SelectField,
      options: titleOptions,
    },
    maritalStatus: {
      component: SelectField,
      options: MARITAL_STATUS_OPTIONS,
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
      condition: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT,
    },
    occupationId: {
      component: AutocompleteField,
      suggester: occupationSuggester,
      condition: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT,
    },
    socialMedia: {
      component: SelectField,
      options: socialMediaOptions,
      condition: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT,
    },
    patientBillingTypeId: {
      component: SuggesterSelectField,
      endpoint: 'patientBillingType',
    },
    motherId: {
      component: AutocompleteField,
      suggester: patientSuggester,
    },
    fatherId: {
      component: AutocompleteField,
      suggester: patientSuggester,
    },
  };

  return (
    <ConfiguredMandatoryPatientFields fields={PERSONAL_FIELDS} filterByMandatory={filterByMandatory} />
  );
};
