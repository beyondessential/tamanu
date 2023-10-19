import React from 'react';

import { PATIENT_REGISTRY_TYPES } from '@tamanu/constants';

import { useLocalisation } from '../../contexts/Localisation';
import { DisplayIdField, TextField } from '..';
import { ConfiguredMandatoryPatientFields } from './ConfiguredMandatoryPatientFields';

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
    },
    drivingLicense: {
      component: TextField,
      condition: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT,
    },
    passport: {
      component: TextField,
    },
  };

  return (
    <ConfiguredMandatoryPatientFields
      fields={IDENTIFICATION_INFORMATION_FIELDS}
      showMandatory={showMandatory}
    />
  );
};
