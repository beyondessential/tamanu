import React from 'react';
import { useSuggester } from '../../api';
import { AutocompleteField, Field } from '../../components';

export const FacilityField = ({ required, label }) => {
  const facilitySuggester = useSuggester('facility');
  return (
    <Field
      name="facilityId"
      label={label}
      component={AutocompleteField}
      suggester={facilitySuggester}
      required={required}
    />
  );
};
