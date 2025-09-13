import React, { useState } from 'react';
import { NumberField, NumberFieldProps } from './index';

export function BaseNumberFieldStory(props: NumberFieldProps): JSX.Element {
  const [value, setValue] = useState(props.value || '');

  const handleChange = (newValue: any) => {
    setValue(newValue);
    if (props.onChange) {
      props.onChange(newValue);
    }
  };

  return <NumberField label={props.label} value={value} onChange={handleChange} />;
}
