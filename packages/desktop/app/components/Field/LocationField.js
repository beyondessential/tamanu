import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@material-ui/core';
import { AutocompleteInput } from './AutocompleteField';

export const LocationInput = React.memo(
  ({
    options,
    groupLabel,
    label,
    onChange,
    onCategoryChange,
    required,
    disabled,
    className,
    name,
    error,
    helperText,
  }) => {
    const [categoryValue, setCategoryValue] = useState(null);
    const [value, setValue] = useState(null);

    const handleChangeCategory = event => {
      setCategoryValue(event.target.value);

      if (typeof onCategoryChange === 'function') {
        onCategoryChange(event.target.value);
      }
    };

    const handleChange = event => {
      setValue(event.target.value);

      if (typeof onChange === 'function') {
        onChange(event.target.value);
      }
    };

    const categoryOptions = options.filter(x => x.parentId === undefined);

    const filteredOptions = categoryValue
      ? options.filter(x => x.parentId === categoryValue)
      : options;

    return (
      <Box className={className}>
        <Box mb={3}>
          <AutocompleteInput
            label={groupLabel}
            onChange={handleChangeCategory}
            value={categoryValue}
            options={categoryOptions}
            disabled={disabled}
          />
        </Box>
        <Box mb={3}>
          <AutocompleteInput
            label={label}
            onChange={handleChange}
            value={value}
            options={filteredOptions}
            required={required}
            disabled={disabled}
            name={name}
            error={error}
            helperText={helperText}
          />
        </Box>
      </Box>
    );
  },
);

LocationInput.propTypes = {
  label: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  name: PropTypes.string,
  className: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
  ),
};

LocationInput.defaultProps = {
  label: '',
  required: false,
  error: false,
  disabled: false,
  name: undefined,
  helperText: '',
  className: '',
  options: [],
};

export const LocationField = ({ field, ...props }) => (
  <LocationInput name={field.name} value={field.value || ''} onChange={field.onChange} {...props} />
);
