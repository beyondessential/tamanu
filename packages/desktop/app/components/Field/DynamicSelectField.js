import React, { useEffect } from 'react';

import { SelectInput } from './SelectField';
import { AutocompleteInput } from './AutocompleteField';

export const DynamicSelectField = ({ field, options, suggester, ...props }) => {
  const [resultLength, setResultLength] = React.useState(0);
  useEffect(() => {
    async function findDataLength() {
      if (options) {
        setResultLength(options.length);
      }
      if (suggester) {
        const results = await suggester.fetchSuggestions();
        setResultLength(results.length);
      }
    }
    findDataLength();
  });

  return resultLength > 7 ? (
    <AutocompleteInput
      name={field.name}
      onChange={field.onChange}
      value={field.value}
      suggester={suggester}
      {...props}
    />
  ) : (
    <SelectInput
      name={field.name}
      onChange={field.onChange}
      value={field.value}
      options={options}
      {...props}
    />
  );
};
