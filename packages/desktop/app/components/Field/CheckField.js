import React from 'react';
import PropTypes from 'prop-types';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';

export const CheckInput = ({ label, value, style, ...props }) => (
  <FormControlLabel
    control={<Checkbox checked={value} value="checked" {...props} />}
    style={style}
    label={label}
  />
);

export const CheckField = ({ field, error, label, disabled, required }) => (
  <CheckInput
    name={field.name}
    value={field.value || false}
    onChange={field.onChange}
    label={label}
    error={error || undefined}
    disabled={disabled}
    required={required}
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
