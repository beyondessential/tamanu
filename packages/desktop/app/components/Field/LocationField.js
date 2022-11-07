import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { LOCATION_AVAILABILITY_TAG_CONFIG } from 'shared/constants';
import { AutocompleteInput } from './AutocompleteField';
import { useApi } from '../../api';
import { Suggester } from '../../utils/suggester';

const locationCategorySuggester = api => {
  return new Suggester(api, 'location', {
    formatter: ({ name, id }) => {
      return {
        label: name,
        value: id,
      };
    },
    baseQueryParameters: { filterByFacility: true },
  });
};

const locationSuggester = (api, categoryValue) => {
  return new Suggester(api, 'location', {
    // Todo: turn on when api is done
    // filterer: l => {
    //   return l.parentId === categoryValue;
    // },
    formatter: ({ name, id, availability }) => {
      return {
        label: name,
        value: id,
        tag: LOCATION_AVAILABILITY_TAG_CONFIG[availability],
      };
    },
    baseQueryParameters: { filterByFacility: true },
  });
};

export const LocationInput = React.memo(
  ({
    categoryLabel,
    label,
    name,
    disabled,
    error,
    helperText,
    required,
    className,
    locationSuggester,
    locationCategorySuggester,
  }) => {
    const api = useApi();
    const [categoryValue, setCategoryValue] = useState('');

    const handleChangeCategory = event => {
      setCategoryValue(event.target.value);
    };

    return (
      <>
        <AutocompleteInput
          label={categoryLabel}
          disabled={disabled}
          onChange={handleChangeCategory}
          value={categoryValue}
          suggester={locationCategorySuggester}
        />
        <AutocompleteInput
          label={label}
          disabled={disabled}
          name={name}
          suggester={locationSuggester}
          helperText={helperText}
          required={required}
          error={error}
          className={className}
        />
      </>
    );
  },
);

export const LocationField = React.memo(({ field, error, ...props }) => {
  return (
    <LocationInput
      name={field.name}
      value={field.value || ''}
      onChange={field.onChange}
      {...props}
    />
  );
});

LocationInput.propTypes = {
  label: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  name: PropTypes.string,
  className: PropTypes.string,
};

LocationInput.defaultProps = {
  label: '',
  required: false,
  error: false,
  disabled: false,
  name: undefined,
  helperText: '',
  className: '',
};
