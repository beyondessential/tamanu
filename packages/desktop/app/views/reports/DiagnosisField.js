import React from 'react';
import { useSuggester } from '../../api';
import { AutocompleteField, Field } from '../../components';

export const DiagnosisField = ({ required, name, label }) => {
  const icd10Suggester = useSuggester('icd10');
  return (
    <Field
      name={name}
      label={label}
      component={AutocompleteField}
      suggester={icd10Suggester}
      required={required}
    />
  );
};
