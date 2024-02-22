import React from 'react';

import { PATIENT_REGISTRY_TYPES } from '@tamanu/constants';

import { useLocalisation } from '../../../../../contexts/Localisation';
import { DisplayIdField, TextField } from '../../../../../components';
import { ConfiguredMandatoryPatientFields } from '../../../ConfiguredMandatoryPatientFields';

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
      fields={IDENTIFICATION_FIELDS}
      filterByMandatory={filterByMandatory}
    />
  );
};
