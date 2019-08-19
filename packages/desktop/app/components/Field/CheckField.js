import React from 'react';
import PropTypes from 'prop-types';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';

export const CheckInput = ({ label, value, ...props }) => (
  <FormControlLabel
    control={<Checkbox checked={value} value="checked" {...props} />}
    label={label}
  />
);

export const CheckField = ({ field, error, ...props }) => (
  <CheckInput
    name={field.name}
    value={field.value || false}
    onChange={field.onChange}
    error={error || undefined}
    {...props}
  />
);

CheckInput.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.bool,
  label: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

CheckInput.defaultProps = {
  value: false,
  label: '',
};
