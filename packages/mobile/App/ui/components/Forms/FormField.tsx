import React, { Component } from 'react';
import { Field as FormikField, useField } from 'formik';

export interface FieldProps {
  component: Component<any> | Function;
  name: string;
  label?: string;
  type?: string;
  disabled?: boolean;
  [key: string]: any;
}

export const Field = ({
  component,
  name,
  label,
  type,
  disabled = false,
  options,
  ...rest
}: FieldProps): JSX.Element => {
  const [field, meta] = useField(name);
  return (
    <FormikField
      as={component}
      name={name}
      onChange={(newValue: any): any => field.onChange({ target: { name, value: newValue } })}
      value={field.value}
      label={label}
      error={meta.error}
      type={type}
      disabled={disabled}
      options={options}
      {...rest}
    />
  );
};
