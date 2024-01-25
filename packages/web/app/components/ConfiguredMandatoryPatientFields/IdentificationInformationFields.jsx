import React from 'react';

import { PATIENT_REGISTRY_TYPES } from '@tamanu/constants';

import { useSettings } from '../../contexts/Settings';
import { DisplayIdField, TextField } from '..';
import { ConfiguredMandatoryPatientFields } from './ConfiguredMandatoryPatientFields';

export const IdentificationInformationFields = ({ isEdit, patientRegistryType, showMandatory }) => {
  const { getSetting } = useSettings();
  const canEditDisplayId = isEdit && getSetting('features.editPatientDisplayId');

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
