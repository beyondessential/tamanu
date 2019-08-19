import React from 'react';
import PropTypes from 'prop-types';
import {
  Radio,
  RadioGroup,
  FormLabel,
  FormControlLabel,
  FormControl,
  FormHelperText,
} from '@material-ui/core';

export const RadioInput = ({ options, name, value, label, helperText, inline, ...props }) => (
  <FormControl {...props}>
    <FormLabel>{label}</FormLabel>
    <RadioGroup
      aria-label={name}
      name={name}
      value={value || ''}
      style={{ flexDirection: inline ? 'row' : 'column' }}
      {...props}
    >
      {options.map(option => (
        <FormControlLabel
          key={option.value}
          control={<Radio />}
          label={option.label}
          value={option.value}
        />
      ))}
    </RadioGroup>
    {helperText && <FormHelperText>{helperText}</FormHelperText>}
  </FormControl>
);

export const RadioField = ({ field, error, ...props }) => (
  <RadioInput
    name={field.name}
    value={field.value || ''}
    onChange={field.onChange}
    error={error || undefined}
    {...props}
  />
);

RadioInput.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.instanceOf(Object)).isRequired,
  inline: PropTypes.bool, // display radio options in single line
};

RadioInput.defaultProps = {
  value: false,
  inline: false,
};
