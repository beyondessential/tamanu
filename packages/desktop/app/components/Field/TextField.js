import React from 'react';
import MuiTextField from '@material-ui/core/TextField';

export const TextField = ({ field, ...props }) => (
  <MuiTextField
    {...props}
    name={field.name}
    value={field.value || ""}
    onChange={field.onChange}
  />
);

