import React from 'react';

import { TextField } from './TextField';

export const DateField = (props) => (
  <TextField
    {...props}
    type="date"
    InputLabelProps={{ shrink: true }}
  />
);

