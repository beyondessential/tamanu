import React from 'react';
import { useSuggester } from '../../api';
import { AutocompleteField, Field } from '../../components';
import { TranslatedText } from '../../components/Translation/TranslatedText';

export const PractitionerField = ({ name = 'practitioner', required, label }) => {
  const practitionerSuggester = useSuggester('practitioner');
  return (
    <Field
      name={name}
      label={
        label ?? (
          <TranslatedText
            stringId="general.localisedField.clinician.label.short"
            fallback="Clinician"
            data-test-id='translatedtext-klvm' />
        )
      }
      component={AutocompleteField}
      suggester={practitionerSuggester}
      required={required}
      data-test-id='field-dvbh' />
  );
};
