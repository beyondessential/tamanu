import React from 'react';

import { SelectField } from './SelectField';
import { AutocompleteField } from './AutocompleteField';

export const DynamicSelectField = ({ field, options, ...props }) => {
  let resultLength = 0;
  if (Array.isArray(options)) {
    resultLength = options.length;
  } else {
    const results = options.fetchSuggestions();
    resultLength = results.length;
  }

  return resultLength > 7 ? (
    <AutocompleteField
      name={field.name}
      onChange={field.onChange}
      value={field.value}
      options={options}
      {...props}
    />
  ) : (
    <SelectField
      name={field.name}
      onChange={field.onChange}
      value={field.value}
      options={options}
      {...props}
    />
  );
};
