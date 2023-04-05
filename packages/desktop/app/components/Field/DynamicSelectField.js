import React, { useEffect, useState } from 'react';

import { SelectInput } from './SelectField';
import { AutocompleteInput } from './AutocompleteField';

export const DynamicSelectField = ({ field, options, suggester, name, ...props }) => {
  const [selectOptions, setSelectOptions] = useState([]);
  const [autocompleteOptions, setAutocompleteOptions] = useState([]);
  const [autocompleteSuggester, setAutocompleteSuggester] = useState(null);

  const SELECT_OPTIONS_LIMIT = 7;

  useEffect(() => {
    async function setInputOptions() {
      const optionsList = suggester ? await suggester.fetchSuggestions() : options;
      if (optionsList.length > SELECT_OPTIONS_LIMIT) {
          setAutocompleteSuggester(suggester);
        } else {
          setAutocompleteOptions(optionsList);
        }
      } else {
        setSelectOptions(optionsList);
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
