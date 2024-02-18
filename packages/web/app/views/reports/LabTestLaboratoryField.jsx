import React from 'react';
import { useSuggester } from '../../api';
import { AutocompleteField, Field } from '../../components';
import { TranslatedText } from '../../components/Translation/TranslatedText';

export const LabTestLaboratoryField = ({ name = 'labTestLaboratory', required }) => {
  const labTestLaboratorySuggester = useSuggester('labTestLaboratory');
  return (
    <Field
      name={name}
      label={
        <TranslatedText
          stringId="report.generate.parameter.labTestLaboratory.label"
          fallback="Lab Test Laboratory"
        />
      }
      component={AutocompleteField}
      suggester={labTestLaboratorySuggester}
      required={required}
    />
  );
};
