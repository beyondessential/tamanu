import React from 'react';
import { TextInput } from './TextField';

export const NumberInput = ({ min, max, step, inputProps = {}, ...props }) => (
  <TextInput
    {...props}
    inputProps={{
      min,
      max,
      step,
      ...inputProps,
    }}
    type="number"
  />
);

export const NumberField = ({ field, ...props }) => (
  <NumberInput name={field.name} value={field.value} onChange={field.onChange} {...props} />
);
