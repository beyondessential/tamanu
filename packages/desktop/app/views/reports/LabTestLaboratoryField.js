import React from 'react';
import { useSuggester } from '../../api';
import { AutocompleteField, Field } from '../../components';

export const LabTestLaboratoryField = ({ name = 'labTestLaboratory', required }) => {
  const labTestLaboratorySuggester = useSuggester('labTestLaboratory');
  return (
    <Field
      name={name}
      label="Lab Test Laboratory"
      component={AutocompleteField}
      suggester={labTestLaboratorySuggester}
      required={required}
    />
  );
};
