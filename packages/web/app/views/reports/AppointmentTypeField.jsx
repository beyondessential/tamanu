import React from 'react';
import { useSuggester } from '../../api';
import { AutocompleteField, Field } from '../../components';

export const AppointmentTypeField = ({ required, name, label }) => {
  const appointmentTypeSuggester = useSuggester('appointmentType');
  return (
    <Field
      name={name}
      label={label}
      component={AutocompleteField}
      suggester={appointmentTypeSuggester}
      required={required}
    />
  );
};
