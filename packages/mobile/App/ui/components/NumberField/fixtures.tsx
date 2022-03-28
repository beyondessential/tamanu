import React from 'react';
import { NumberField, NumberFieldProps } from './index';

export function BaseNumberFieldStory(props: NumberFieldProps): JSX.Element {
  return (
    <NumberField
      label={props.label}
      value={props.value}
      onChange={props.onChange}
    />
  );
}
