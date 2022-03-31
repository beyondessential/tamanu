import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useApi } from '../../api';
import { SelectInput } from './SelectField';

export const SuggesterSelectField = React.memo(
  ({ field, endpoint, resultsLimit = 100, ...props }) => {
    const api = useApi();
    const [options, setOptions] = useState([]);

    useEffect(() => {
      api.get(`suggestions/${encodeURIComponent(endpoint)}/all`).then(resultData => {
        setOptions([
          ...resultData.data.slice(0, resultsLimit).map(({ id, name }) => ({
            value: id,
            label: name,
          })),
        ]);
      });
    }, [api, setOptions, endpoint, resultsLimit]);

    return (
      <SelectInput
        name={field.name}
        options={options}
        onChange={field.onChange}
        value={field.value}
        {...props}
      />
    );
  },
);

SuggesterSelectField.propTypes = {
  endpoint: PropTypes.string.isRequired,
  field: PropTypes.shape({
    label: PropTypes.string,
    value: PropTypes.string,
    name: PropTypes.string,
  }).isRequired,
  resultsLimit: PropTypes.number,
};

SuggesterSelectField.defaultProps = {
  resultsLimit: null,
};
