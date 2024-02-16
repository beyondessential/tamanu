import React from 'react';
import { TextField } from '../../../../../components';
import { ConfiguredMandatoryPatientFields } from '../../../../../components/ConfiguredMandatoryPatientFields/ConfiguredMandatoryPatientFields';


export const CambodiaIdentificationFields = ({  showMandatory }) => {
  const IDENTIFICATION_FIELDS = {
    birthCertificate: {
      component: TextField,
    },
    passport: {
      component: TextField,
    },
  };

  return (
    <ConfiguredMandatoryPatientFields
      fields={IDENTIFICATION_FIELDS}
      showMandatory={showMandatory}
    />
  );
};
