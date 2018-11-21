import React from 'react';

import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';

export const CheckField = ({ field, label, ...props }) => (
  <FormControlLabel
    control={
      <Checkbox
        name={field.name}
        checked={field.value || false}
        onChange={field.onChange}
        value="checked"
      />
    }
    label={label}
  />
);
