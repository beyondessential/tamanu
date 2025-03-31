import React from 'react';
import { useSuggester } from '../../api';
import { AutocompleteField, Field } from '../../components';

export const DiagnosisField = ({ required, name, label }) => {
  const diagnosisSuggester = useSuggester('diagnosis');
  return (
    <Field
      name={name}
      label={label}
      component={AutocompleteField}
      suggester={diagnosisSuggester}
      required={required}
      data-testid='field-2t2a' />
  );
};
