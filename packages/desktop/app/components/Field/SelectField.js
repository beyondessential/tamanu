import React from 'react';
import MuiTextField from '@material-ui/core/TextField';
import MuiMenuItem from '@material-ui/core/MenuItem';
import PropTypes from 'prop-types';

export const SelectInput = ({ options, value, ...props }) => (
  <MuiTextField
    select
    InputLabelProps={{ shrink: true }}
    value={value || ''}
    variant="outlined"
    {...props}
  >
    {options.map(o => (
      <MuiMenuItem key={o.value} value={o.value}>
        {o.label}
      </MuiMenuItem>
    ))}
  </MuiTextField>
);

export const SelectField = ({ field, ...props }) => (
  <SelectInput name={field.name} value={field.value || ''} onChange={field.onChange} {...props} />
);

SelectInput.propTypes = {
  name: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  options: PropTypes.arrayOf(PropTypes.instanceOf(Object)),
  fullWidth: PropTypes.bool,
};

SelectInput.defaultProps = {
  value: '',
  options: [],
  fullWidth: true,
};
