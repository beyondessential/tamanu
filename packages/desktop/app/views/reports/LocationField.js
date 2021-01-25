import React from 'react';
import { connectApi } from '../../api';
import { AutocompleteField, Field } from '../../components';
import { Suggester } from '../../utils/suggester';

const DumbLocationField = ({ locationSuggester, required }) => {
  return (
    <Field
      name="location"
      label="Facility"
      component={AutocompleteField}
      suggester={locationSuggester}
      required={required}
    />
  );
};

export const LocationField = connectApi(api => ({
  locationSuggester: new Suggester(api, 'location'),
}))(DumbLocationField);
