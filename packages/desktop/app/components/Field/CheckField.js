import React from 'react';

import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';

export const CheckInput = ({ label, value, ...props }) => (
  <FormControlLabel
    control={
      <Checkbox
        checked={value}
        value="checked"
        {...props}
      />
    }
    label={label}
  />
);

export const CheckField = ({ field, ...props }) => (
  <CheckInput
    name={field.name}
    value={field.value || false}
    onChange={field.onChange}
    {...props}
  />
);
