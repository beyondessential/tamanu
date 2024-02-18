import React from 'react';
import { TextField } from '../../../../../components';
import { ConfiguredMandatoryPatientFields } from '../../../../../components/ConfiguredMandatoryPatientFields';
import { PatientField } from '../../../PatientDetailsForm';
import { PATIENT_FIELD_DEFINITION_TYPES } from '@tamanu/constants';

export const CambodiaIdentificationFields = ({ filterByMandatory }) => {
  const IDENTIFICATION_FIELDS = {
    birthCertificate: {
      component: TextField,
    },
    passport: {
      component: TextField,
    },
  };

  return (
    <>
      <ConfiguredMandatoryPatientFields
        fields={IDENTIFICATION_FIELDS}
        filterByMandatory={filterByMandatory}
      />
      <PatientField
        definition={{
          name: 'National ID',
          definitionId: 'fieldDefinition-nationalId',
          fieldType: PATIENT_FIELD_DEFINITION_TYPES.STRING,
        }}
      />
    </>
  );
};
