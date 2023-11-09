import React from 'react';
import { useSuggester } from '../../api';
import { AutocompleteField, Field, LocalisedText } from '../../components';

export const PractitionerField = ({ name = 'practitioner', required }) => {
  const practitionerSuggester = useSuggester('practitioner');
  return (
    <Field
      name={name}
      label={<LocalisedText path="fields.clinician.shortLabel" />}
      component={AutocompleteField}
      suggester={practitionerSuggester}
      required={required}
    />
  );
};
