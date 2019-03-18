import React from 'react';
import MuiTextField from '@material-ui/core/TextField';

export const TextInput = MuiTextField;

export const TextField = ({ field, ...props }) => (
  <TextInput
    {...props}
    name={field.name}
    value={field.value || ''}
    onChange={field.onChange}
  />
);
