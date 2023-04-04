import React, { ReactNode } from 'react';
import { Field as FormikField, useField, useFormikContext } from 'formik';
import { FORM_STATUSES } from '/helpers/constants';

export interface FieldProps {
  component: ReactNode;
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
  const formikContext = useFormikContext();
  const { validateOnChange, status, submitCount } = formikContext;

  // Show errors if
  // 1. validateOnChange is false OR 
  // 2. if the user has already tried to submit the form (submitCount > 0) OR
  // 3. if the user has already tried to move to the next page of the form (ie: Survey and status === FORM_STATUSES.SUBMIT_SCREEN_ATTEMPTED)
  // We don't want errors displayed by on change events before user submits.
  const showError = !validateOnChange || status === FORM_STATUSES.SUBMIT_SCREEN_ATTEMPTED || submitCount;
  const error = showError ? meta.error : null;

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
      error={error}
      type={type}
      disabled={disabled}
      options={options}
      {...rest}
    />
  );
};
