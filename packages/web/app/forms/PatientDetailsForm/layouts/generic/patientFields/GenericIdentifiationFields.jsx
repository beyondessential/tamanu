import React from 'react';

import { PATIENT_REGISTRY_TYPES } from '@tamanu/constants';

import { AutocompleteField, DisplayIdField, TextField } from '../../../../../components';
import { ConfiguredMandatoryPatientFields } from '../../../ConfiguredMandatoryPatientFields';
import { TranslatedText } from '../../../../../components/Translation/TranslatedText';
import { useSuggester } from '../../../../../api';
import { useSettings } from '../../../../../contexts/Settings';

export const GenericIdentificationFields = ({ isEdit, patientRegistryType, filterByMandatory }) => {
  const { getSetting } = useSettings()
  const insurerSuggester = useSuggester('insurer');
  const canEditDisplayId = isEdit && getSetting('features.editPatientDisplayId');
  const enablePatientInsurer = getSetting('features.enablePatientInsurer');

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
          data-testid='translatedtext-yihy' />
      ),
    },
    insurerId: {
      component: AutocompleteField,
      suggester: insurerSuggester,
      label: (
        <TranslatedText
          stringId="general.localisedField.insurer.label"
          fallback="Insurer"
          data-testid='translatedtext-kq3u' />
      ),
      condition: () => !!enablePatientInsurer,
    },
    insurerPolicyNumber: {
      component: TextField,
      label: (
        <TranslatedText
          stringId="general.localisedField.insurerPolicyNumber.label"
          fallback="Insurance policy number"
          data-testid='translatedtext-govk' />
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
          data-testid='translatedtext-b397' />
      ),
    },
    passport: {
      component: TextField,
      label: (
        <TranslatedText
          stringId="general.localisedField.passport.label"
          fallback="Passport number"
          data-testid='translatedtext-bl6j' />
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
