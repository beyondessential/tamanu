import React from 'react';
import { NumberInput } from './NumberField';

export const PriceField = ({ field, ...props }) => {
  const handleInput = e => {
    const value = e.target.value;
    // If value is negative just return empty
    if (/^[−-]/.test(value)) {
      e.target.value = '';
      return;
    }
    // If the value is a decinal number, set it to 2 decimal places
    if (value.includes('.')) {
      const decimalPlaces = value.split('.')[1].length;
      if (decimalPlaces > 2) {
        e.target.value = parseFloat(value).toFixed(2);
      }
    }
  };
  return (
    <NumberInput
      value={field.value}
      name={field.name}
      onChange={field.onChange}
      onInput={handleInput}
      step="0.01"
      min={0}
      max={999999}
      {...props}
      data-testid="numberinput-qwug"
    />
  );
};
