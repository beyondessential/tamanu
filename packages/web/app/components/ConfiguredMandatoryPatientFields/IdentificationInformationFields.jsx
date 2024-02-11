import React from 'react';

import { PATIENT_REGISTRY_TYPES } from '@tamanu/constants';

import { useLocalisation } from '../../contexts/Localisation';
import { DisplayIdField, TextField } from '..';
import { ConfiguredMandatoryPatientFields } from './ConfiguredMandatoryPatientFields';
import { TranslatedText } from '../Translation/TranslatedText';

export const IdentificationInformationFields = ({ isEdit, patientRegistryType, showMandatory }) => {
  const { getLocalisation } = useLocalisation();
  const canEditDisplayId = isEdit && getLocalisation('features.editPatientDisplayId');

  const IDENTIFICATION_INFORMATION_FIELDS = {
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
      fields={IDENTIFICATION_INFORMATION_FIELDS}
      showMandatory={showMandatory}
    />
  );
};
