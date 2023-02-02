import React, { ReactNode } from 'react';
import { Field as FormikField, useField } from 'formik';

export interface FieldProps {
  component: ReactNode
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
  onChange,
  ...rest
}: FieldProps): JSX.Element => {
  const [field, meta] = useField(name);
  const combinedOnChange = (newValue: any): any => {
    if (onChange) {
      onChange(newValue);
    }
    return field.onChange({ target: { name, value: newValue } });
  };
  return (
    <FormikField
      as={component}
      name={name}
      onChange={combinedOnChange}
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
