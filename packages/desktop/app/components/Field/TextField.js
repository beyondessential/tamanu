import React from 'react';
import MuiTextField from '@material-ui/core/TextField';
import PropTypes from 'prop-types';

export const TextInput = ({ value, ...props }) => (
  <MuiTextField
    value={value || ''}
    variant="outlined"
    InputLabelProps={{ shrink: true }}
    {...props}
  />
);

export const TextField = ({ field, ...props }) => (
  <TextInput name={field.name} value={field.value || ''} onChange={field.onChange} {...props} />
);

TextInput.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  fullWidth: PropTypes.bool,
};

TextInput.defaultProps = {
  value: '',
  fullWidth: true,
};
