import React from 'react';
import { useSuggester } from '../../api';
import { AutocompleteField, Field } from '../../components';
import { TranslatedText } from '../../components/Translation/TranslatedText';

export const PractitionerField = ({ name = 'practitioner', required }) => {
  const practitionerSuggester = useSuggester('practitioner');
  return (
    <Field
      name={name}
      label={
        <TranslatedText
          stringId="general.localisedField.clinician.label.short"
          fallback="Clinician"
        />
      }
      component={AutocompleteField}
      suggester={practitionerSuggester}
      required={required}
    />
  );
};
