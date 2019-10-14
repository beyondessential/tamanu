import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { TextInput } from './TextField';

export const NumberInput = props => <TextInput {...props} type="number" />;

export const NumberField = ({ field, onChange, ...props }) => {
  const handleChange = useCallback(
    (...args) => {
      if (onChange) {
        onChange(...args);
      }
      field.onChange(...args);
    },
    [onChange, field.onChange],
  );
  return <NumberInput name={field.name} value={field.value} onChange={handleChange} {...props} />;
};

NumberInput.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.number,
  onChange: PropTypes.func.isRequired,
};

NumberInput.defaultProps = {
  value: 0,
};
