import React from 'react';

import { TextInput } from './TextField';

export const NumberInput = (props) => (
  <TextInput
    {...props}
    type="number"
  />
);

export const NumberField = ({ field, ...props }) => (
  <NumberInput 
    name={field.name}
    value={field.value || 0}
    onChange={field.onChange}
    {...props}
  />
);
