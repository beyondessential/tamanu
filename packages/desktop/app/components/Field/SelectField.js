import React from 'react';
import MuiTextField from '@material-ui/core/TextField';
import MuiMenuItem from '@material-ui/core/MenuItem';

export const SelectInput = ({ options, value, ...props }) => (
  <MuiTextField
    select
    InputLabelProps={{
      shrink: !!value,
    }}
    value={value}
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
  <SelectInput
    {...props}
    name={field.name}
    value={field.value}
    onChange={field.onChange}
  />
);
