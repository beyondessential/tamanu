import React from 'react';
import { TextField } from '../../../../../components';
import { ConfiguredMandatoryPatientFields } from '../../../ConfiguredMandatoryPatientFields';
import { PatientField } from '../../../PatientFields';
import { PATIENT_FIELD_DEFINITION_TYPES } from '@tamanu/constants';

const NATIONAL_ID_DEFINITION_ID = 'fieldDefinition-nationalId';
const ID_POOR_CARD_NUMBER_DEFINITION_ID = 'fieldDefinition-idPoorCardNumber';
const PMRS_NUMBER_DEFINITION_ID = 'fieldDefinition-pmrsNumber';

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
          definitionId: NATIONAL_ID_DEFINITION_ID,
          fieldType: PATIENT_FIELD_DEFINITION_TYPES.STRING,
        }}
      />
      <PatientField
        definition={{
          name: 'ID Poor Card Number',
          definitionId: ID_POOR_CARD_NUMBER_DEFINITION_ID,
          fieldType: PATIENT_FIELD_DEFINITION_TYPES.STRING,
        }}
      />
      <PatientField
        definition={{
          name: 'PMRS Number',
          definitionId: PMRS_NUMBER_DEFINITION_ID,
          fieldType: PATIENT_FIELD_DEFINITION_TYPES.STRING,
        }}
      />
    </>
  );
};
