import React from 'react';
import PropTypes from 'prop-types';
import { TextInput } from './TextField';

export const NumberInput = ({ min, max, step, tabIndex, ...props }) => (
  <TextInput
    {...props}
    inputProps={{
      min,
      max,
      step,
      tabIndex,
    }}
    type="number"
  />
);

export const NumberField = ({ field, ...props }) => (
  <NumberInput name={field.name} value={field.value} onChange={field.onChange} {...props} />
);

NumberInput.propTypes = {
  name: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onChange: PropTypes.func.isRequired,
};

NumberInput.defaultProps = {
  name: null,
  value: null,
};
