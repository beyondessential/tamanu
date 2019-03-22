import React from 'react';
import PropTypes from 'prop-types';
import {
  Radio, RadioGroup, FormLabel, FormControlLabel,
} from '@material-ui/core';

export const RadioInput = ({
  options, name, value, ...props
}) => (
  <RadioGroup
    aria-label={name}
    name={name}
    value={value}
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
);

export const RadioField = ({ label, ...props }) => (
  <React.Fragment>
    <FormLabel component="legend">{label}</FormLabel>
    <RadioInput {...props} />
  </React.Fragment>
);

RadioField.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.instanceOf(Object)).isRequired,
};

RadioField.defaultProps = {
  value: false,
};
