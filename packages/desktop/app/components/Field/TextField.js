import React from 'react';
import MuiTextField from '@material-ui/core/TextField';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';

const styles = () => ({
  root: {
    background: '#fff',
  },
});

export const TextInput = withStyles(styles)(({ value, label, ...props }) => (
  <OuterLabelFieldWrapper label={label} {...props}>
    <MuiTextField value={value || ''} variant="outlined" {...props} />
  </OuterLabelFieldWrapper>
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
