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
            data-testid='translatedtext-e2hg' />
        )
      }
      component={AutocompleteField}
      suggester={labTestLaboratorySuggester}
      required={required}
      data-testid='field-g4c9' />
  );
};
