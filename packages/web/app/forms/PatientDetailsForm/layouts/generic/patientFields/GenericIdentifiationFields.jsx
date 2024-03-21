import React from 'react';

import { PATIENT_REGISTRY_TYPES } from '@tamanu/constants';

import { TextField } from '../../../../../components';
import { ConfiguredMandatoryPatientFields } from '../../../ConfiguredMandatoryPatientFields';
import { TranslatedText } from '../../../../../components/Translation/TranslatedText';

export const GenericIdentificationFields = ({ patientRegistryType, filterByMandatory }) => {
  const IDENTIFICATION_FIELDS = {
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
