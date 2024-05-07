import React from 'react';

import { PATIENT_REGISTRY_TYPES } from '@tamanu/constants';

import { useLocalisation } from '../../../../../contexts/Localisation';
import { AutocompleteField, DisplayIdField, TextField } from '../../../../../components';
import { ConfiguredMandatoryPatientFields } from '../../../ConfiguredMandatoryPatientFields';
import { TranslatedText } from '../../../../../components/Translation/TranslatedText';
import { useSuggester } from '../../../../../api';

export const GenericIdentificationFields = ({ isEdit, patientRegistryType, filterByMandatory }) => {
  const { getLocalisation } = useLocalisation();
  const insurerSuggester = useSuggester('insurer');
  const canEditDisplayId = isEdit && getLocalisation('features.editPatientDisplayId');

  const IDENTIFICATION_FIELDS = {
    insurerId: {
      component: AutocompleteField,
      suggester: insurerSuggester,
      label: (
        <TranslatedText
          stringId="general.localisedField.insurer.label"
          fallback="Insurer"
        />
      ),
      condition: () => !!isEdit,
    },
    insurerPolicyNumber: {
      component: TextField,
      label: (
        <TranslatedText
          stringId="general.localisedField.insurerPolicyNumber.label"
          fallback="Insurance policy number"
        />
      ),
      condition: () => !!isEdit,
    },
    displayId: {
      component: DisplayIdField,
      condition: () => !!canEditDisplayId,
    },
    birthCertificate: {
      component: TextField,
      label: (
        <TranslatedText
          stringId="general.localisedField.birthCertificate.label"
          fallback="Birth certificate number"
        />
      ),
    },
    drivingLicense: {
      component: TextField,
      condition: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT,
      label: (
        <TranslatedText
          stringId="general.localisedField.drivingLicense.label"
          fallback="Driving license number"
        />
      ),
    },
    passport: {
      component: TextField,
      label: (
        <TranslatedText
          stringId="general.localisedField.passport.label"
          fallback="Passport number"
        />
      ),
    },
  };

  return (
    <ConfiguredMandatoryPatientFields
      fields={IDENTIFICATION_FIELDS}
      filterByMandatory={filterByMandatory}
    />
  );
};
