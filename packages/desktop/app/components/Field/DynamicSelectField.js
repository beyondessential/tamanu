import React, { useEffect, useState } from 'react';

import { SelectInput } from './SelectField';
import { AutocompleteInput } from './AutocompleteField';

const SELECT_OPTIONS_LIMIT = 7;

export const DynamicSelectField = ({ field, options, suggester, name, ...props }) => {
  const [selectOptions, setSelectOptions] = useState([]);

  useEffect(() => {
    async function setInputOptions() {
      const optionsList = suggester ? await suggester.fetchSuggestions() : options;
      setSelectOptions(optionsList);
    }
    setInputOptions();
  }, [options, suggester]);

  return selectOptions.length > SELECT_OPTIONS_LIMIT ? (
    <AutocompleteInput suggester={suggester} options={selectOptions} {...props} {...field} />
  ) : (
    <SelectInput options={selectOptions} {...props} {...field} />
  );
};
