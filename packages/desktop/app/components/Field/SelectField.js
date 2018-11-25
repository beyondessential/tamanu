import React from 'react';
import MuiTextField from '@material-ui/core/TextField';
import MuiMenuItem from '@material-ui/core/MenuItem';

export const SelectField = ({ field, options, ...props }) => (
  <MuiTextField 
    select
    name={ field.name }
    value={ field.value || "" }
    onChange={ field.onChange }
    InputLabelProps={{
      shrink: !!field.value,
    }}
    { ...props }
  >
    {options.map(o => (
      <MuiMenuItem key={o.value} value={o.value}>
        {o.label}
      </MuiMenuItem>
    ))}
  </MuiTextField>
);
