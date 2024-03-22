import React from 'react';

import { PATIENT_REGISTRY_TYPES } from '@tamanu/constants';

import { useLocalisation } from '../../../../../contexts/Localisation';
import { DisplayIdField, TextField } from '../../../../../components';
import { ConfiguredMandatoryPatientFields } from '../../../ConfiguredMandatoryPatientFields';
import { TranslatedText } from '../../../../../components/Translation/TranslatedText';

export const GenericIdentificationFields = ({ isEdit, patientRegistryType, filterByMandatory }) => {
  const { getLocalisation } = useLocalisation();
  const canEditDisplayId = isEdit && getLocalisation('features.editPatientDisplayId');
  
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
