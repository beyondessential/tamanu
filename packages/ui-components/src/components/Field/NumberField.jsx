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
    onWheel={(event) => {
      // Prevents increasing/decreasing the value. It needs to be blurred because
      // it's not possible to prevent the event from bubbling up to the parent element.
      // This makes the element no longer focused and so the value is not changed.
      event.target.blur();
    }}
  />
);

export const NumberField = ({ field, ...props }) => (
  <NumberInput name={field.name} value={field.value} onChange={field.onChange} {...props} />
);
