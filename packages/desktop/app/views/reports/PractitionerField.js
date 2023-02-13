import React from 'react';
import { useSuggester } from '../../api';
import { AutocompleteField, Field } from '../../components';

export const PractitionerField = ({ name = 'practitioner', required }) => {
  const practitionerSuggester = useSuggester('practitioner');
  return (
    <Field
      name={name}
      label="Doctor/nurse"
      component={AutocompleteField}
      suggester={practitionerSuggester}
      required={required}
    />
  );
};
