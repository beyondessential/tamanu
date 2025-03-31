import React from 'react';
import { useSuggester } from '../../api';
import { AutocompleteField, Field } from '../../components';
import { TranslatedText } from '../../components/Translation/TranslatedText';

export const LabTestLaboratoryField = ({ name = 'labTestLaboratory', label, required }) => {
  const labTestLaboratorySuggester = useSuggester('labTestLaboratory');
  return (
    <Field
      name={name}
      label={
        label ?? (
          <TranslatedText
            stringId="report.generate.parameter.labTestLaboratory.label"
            fallback="Lab Test Laboratory"
            data-test-id='translatedtext-dkoa' />
        )
      }
      component={AutocompleteField}
      suggester={labTestLaboratorySuggester}
      required={required}
      data-test-id='field-55iv' />
  );
};
