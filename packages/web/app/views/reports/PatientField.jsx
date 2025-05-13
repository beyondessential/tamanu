import React from 'react';
import { usePatientSuggester } from '../../api';
import { AutocompleteField, Field } from '../../components';

export const PatientField = ({ name = 'patientId', required, label }) => {
  const patientSuggester = usePatientSuggester();
  return (
    <Field
      name={name}
      label={label}
      component={AutocompleteField}
      suggester={patientSuggester}
      required={required}
      data-testid="field-2od3"
    />
  );
};
