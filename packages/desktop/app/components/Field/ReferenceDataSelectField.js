import React, { useEffect, useState } from 'react';
import { useApi } from '../../api';
import { SelectInput } from './SelectField';

/**
 * Select from a fetched list of reference data
 *
 * type - the reference data type from the db to filter the list on
 * resultsLimit - a sensible max number of results. Use autocomplete for longer lists
 */
export const ReferenceDataSelectField = ({
  field,
  FieldProps,
  dataType,
  resultsLimit = 100,
  ...props
}) => {
  const api = useApi();
  const [options, setOptions] = useState([]);

  useEffect(() => {
    api.get('referenceData', { type: dataType }).then(resultData => {
      setOptions([
        { value: '', label: 'Select' },
        ...resultData.data.slice(0, resultsLimit).map(({ id, name }) => ({
          value: id,
          label: name,
        })),
      ]);
    });
  }, [api, setOptions, dataType, resultsLimit]);

  return (
    <SelectInput
      name={field.name}
      options={options}
      onChange={field.onChange}
      value={field.value}
      {...props}
    />
  );
};
