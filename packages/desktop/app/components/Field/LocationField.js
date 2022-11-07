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
    filterer: l => {
      // return all locations if no category is selected
      if (!categoryValue) {
        return true;
      }
      return l.parentId === categoryValue;
    },
    formatter: ({ name, id, availability }) => {
      // if a category is selected return the comma seperated list of locations
      if (categoryValue) {
        // 1. Get children (locations with a parent id)
        // 2a. Make a library keyed by id
        // 2. Get the parent and pre-pend it to the child

        return {
          label: name,
          value: id,
          tag: LOCATION_AVAILABILITY_TAG_CONFIG[availability],
        };
      }

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
    value,
    onChange,
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
          suggester={locationCategorySuggester(api)}
        />
        <AutocompleteInput
          label={label}
          disabled={disabled}
          name={name}
          suggester={locationSuggester(api, categoryValue)}
          helperText={helperText}
          required={required}
          error={error}
          value={value}
          onChange={onChange}
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
