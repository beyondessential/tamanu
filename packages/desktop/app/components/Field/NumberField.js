import React from 'react';
import PropTypes from 'prop-types';
import { TextInput } from './TextField';

export const NumberInput = props => <TextInput {...props} type="number" />;

export const NumberField = ({ field, ...props }) => (
  <NumberInput name={field.name} value={field.value || ''} onChange={field.onChange} {...props} />
);

NumberInput.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.number,
  onChange: PropTypes.func.isRequired,
};

NumberInput.defaultProps = {
  value: 0,
};
