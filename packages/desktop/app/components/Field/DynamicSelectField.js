import React, { useEffect, useState } from 'react';

import { SelectInput } from './SelectField';
import { AutocompleteInput } from './AutocompleteField';

export const DynamicSelectField = ({ field, options, suggester, name, ...props }) => {
  const [selectOptions, setSelectOptions] = useState([]);
  const SELECT_OPTIONS_LIMIT = 7;

  useEffect(() => {
    async function setInputOptions() {
      const optionsList = suggester ? await suggester.fetchSuggestions() : options;
      setSelectOptions(optionsList);
    }
    setInputOptions();
  }, [options, suggester]);

  return selectOptions.length > SELECT_OPTIONS_LIMIT ? (
    <AutocompleteInput
      name={field.name}
      onChange={field.onChange}
      value={field.value}
      suggester={suggester}
      options={selectOptions}
      {...props}
    />
  ) : (
    <SelectInput
      name={field.name}
      onChange={field.onChange}
      value={field.value}
      options={selectOptions}
      {...props}
    />
  );
};
