import React from 'react';
import MuiTextField from '@material-ui/core/TextField';
import PropTypes from 'prop-types';

export const TextInput = MuiTextField;

export const TextField = ({ value, ...props }) => (
  <TextInput
    fullWidth
    value={value || ''}
    {...props}
  />
);

TextField.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

TextField.defaultProps = {
  value: '',
};
