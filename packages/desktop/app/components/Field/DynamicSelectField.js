import React, { useEffect, useState } from 'react';

import { SelectInput } from './SelectField';
import { AutocompleteInput } from './AutocompleteField';

export const DynamicSelectField = ({ field, options, suggester, name, ...props }) => {
  const [selectOptions, setSelectOptions] = useState([]);
  const [autocompleteOptions, setAutocompleteOptions] = useState([]);
  const [autocompleteSuggester, setAutocompleteSuggester] = useState(null);

  useEffect(() => {
    async function setInputOptions() {
      const optionsList = suggester ? await suggester.fetchSuggestions() : options;
      if (optionsList.length <= 7) {
        setSelectOptions(optionsList);
      } else if (optionsList.length > 7 && !suggester) {
        setAutocompleteOptions(optionsList);
      } else {
        setAutocompleteSuggester(suggester);
      }
    }
    setInputOptions();
  }, [options, suggester]);

  return selectOptions.length > 0 ? (
    <SelectInput
      name={field.name}
      onChange={field.onChange}
      value={field.value}
      options={selectOptions}
      {...props}
    />
  ) : (
    <AutocompleteInput
      name={field.name}
      onChange={field.onChange}
      value={field.value}
      suggester={autocompleteSuggester}
      options={autocompleteOptions}
      {...props}
    />
  );
};
