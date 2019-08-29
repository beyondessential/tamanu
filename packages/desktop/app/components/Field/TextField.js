import React from 'react';
import MuiTextField from '@material-ui/core/TextField';
import { withStyles } from '@material-ui/core';
import PropTypes from 'prop-types';

const styles = () => ({
  root: {
    background: '#fff',
  },
});

export const TextInput = withStyles(styles)(({ value, ...props }) => (
  <MuiTextField
    value={value || ''}
    variant="outlined"
    InputLabelProps={{ shrink: true }}
    {...props}
  />
));

export const TextField = ({ field, ...props }) => (
  <TextInput name={field.name} value={field.value || ''} onChange={field.onChange} {...props} />
);

TextInput.propTypes = {
  name: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  fullWidth: PropTypes.bool,
};

TextInput.defaultProps = {
  value: '',
  fullWidth: true,
};
