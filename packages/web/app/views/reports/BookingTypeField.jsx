import React from 'react';
import { useSuggester } from '../../api';
import { AutocompleteField, Field } from '../../components';

export const BookingTypeField = ({ required, name, label }) => {
  const bookingTypeSuggester = useSuggester('bookingType');
  return (
    <Field
      name={name}
      label={label}
      component={AutocompleteField}
      suggester={bookingTypeSuggester}
      required={required}
    />
  );
};
