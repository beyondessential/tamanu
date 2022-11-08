import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { LOCATION_AVAILABILITY_TAG_CONFIG } from 'shared/constants';
import { AutocompleteInput } from './AutocompleteField';
import { useApi } from '../../api';
import { Suggester } from '../../utils/suggester';

const locationCategorySuggester = (api, locationValue) => {
  console.log('locationValue', locationValue);
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

const locationSuggester = (api, groupValue) => {
  return new Suggester(api, 'location', {
    filterer: ({ locationGroup }) => {
      // if no category is selected, return all child locations and display their parents with a
      // comma bellow
      if (!groupValue) {
        return locationGroup?.id !== undefined;
      }
      return locationGroup?.id === groupValue;
    },
    formatter: ({ name, id, locationGroup, availability }, index, suggestions) => {
      let label = name;
      // if a category is selected return the comma seperated list of locations
      if (!groupValue) {
        // 2. Get the parent and pre-pend it to the child
        const parent = suggestions.find(x => x.locationGroup?.id === locationGroup?.id);
        label = parent ? `${parent.name}, ${name}` : name;
      }

      return {
        label,
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
    const [locationValue, setLocationValue] = useState(value);
    const [groupValue, setGroupValue] = useState('');

    const handleChangeCategory = event => {
      setGroupValue(event.target.value);
    };

    const handleChange = event => {
      setLocationValue(event.target.value);
      onChange({ target: { value: event.target.value, name } });
    };

    return (
      <>
        <AutocompleteInput
          label={categoryLabel}
          disabled={disabled}
          onChange={handleChangeCategory}
          value={groupValue}
          suggester={locationCategorySuggester(api, locationValue)}
        />
        <AutocompleteInput
          label={label}
          disabled={disabled}
          name={name}
          suggester={locationSuggester(api, groupValue)}
          helperText={helperText}
          required={required}
          error={error}
          value={locationValue}
          onChange={handleChange}
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
