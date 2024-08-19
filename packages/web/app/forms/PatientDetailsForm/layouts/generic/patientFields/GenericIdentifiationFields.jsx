import React from 'react';

import { PATIENT_REGISTRY_TYPES } from '@tamanu/constants';

import { useLocalisation } from '../../../../../contexts/Localisation';
import { AutocompleteField, DisplayIdField, TextField } from '../../../../../components';
import { ConfiguredMandatoryPatientFields } from '../../../ConfiguredMandatoryPatientFields';
import { TranslatedText } from '../../../../../components/Translation/TranslatedText';
import { useSuggester } from '../../../../../api';
import { useSettings } from '../../../../../contexts/Settings';

export const GenericIdentificationFields = ({ isEdit, patientRegistryType, filterByMandatory }) => {
  const { getLocalisation } = useLocalisation();
  const { getSetting } = useSettings()
  const insurerSuggester = useSuggester('insurer');
  const canEditDisplayId = isEdit && getSetting('features.editPatientDisplayId');
  const enablePatientInsurer = getLocalisation('features.enablePatientInsurer');

  const IDENTIFICATION_FIELDS = {
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
    insurerId: {
      component: AutocompleteField,
      suggester: insurerSuggester,
      label: (
        <TranslatedText
          stringId="general.localisedField.insurer.label"
          fallback="Insurer"
        />
      ),
      condition: () => !!enablePatientInsurer,
    },
    insurerPolicyNumber: {
      component: TextField,
      label: (
        <TranslatedText
          stringId="general.localisedField.insurerPolicyNumber.label"
          fallback="Insurance policy number"
        />
      ),
      condition: () => !!enablePatientInsurer,
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
