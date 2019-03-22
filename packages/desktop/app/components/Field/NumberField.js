import React from 'react';
import PropTypes from 'prop-types';
import { TextInput } from './TextField';

export const NumberInput = (props) => (
  <TextInput
    {...props}
    type="number"
  />
);

export const NumberField = ({ ...props }) => (
  <NumberInput {...props} />
);

NumberField.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.number,
  onChange: PropTypes.func.isRequired,
};

NumberField.defaultProps = {
  value: 0,
};
