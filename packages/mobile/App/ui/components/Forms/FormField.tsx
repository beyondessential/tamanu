import React, { ReactNode, useCallback } from 'react';
import { Field as FormikField, useField, useFormikContext } from 'formik';
import { SUBMIT_ATTEMPTED_STATUS } from '@tamanu/constants';
import { TranslatedTextElement } from '../Translations/TranslatedText';

export interface FieldProps {
  component: ReactNode;
  name: string;
  label?: TranslatedTextElement;
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
  const { validateOnChange, status, submitCount } = useFormikContext();

  const showError = !validateOnChange || status === SUBMIT_ATTEMPTED_STATUS || submitCount > 0;
  const error = showError ? meta.error : null;

  const combinedOnChange = useCallback((newValue: any, selectedItem: any): any => {
    if (onChange) {
      onChange(newValue, selectedItem);
    }
    return field.onChange({ target: { name, value: newValue } });
  }, [field.onChange, name, onChange]);

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
