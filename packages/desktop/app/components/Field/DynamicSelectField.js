import React, { useEffect } from 'react';

import { SelectInput } from './SelectField';
import { AutocompleteInput } from './AutocompleteField';

export const DynamicSelectField = ({ field, options, suggester, name, ...props }) => {
  const [selectOptions, setSelectOptions] = React.useState([]);
  const [autocompleteOptions, setAutocompleteOptions] = React.useState([]);
  const [autocompleteSuggester, setAutocompleteSuggester] = React.useState(null);

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
