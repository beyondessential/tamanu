import React, { type ReactNode, useCallback } from 'react';
import { Field as FormikField, useField, useFormikContext } from 'formik';
import { SUBMIT_ATTEMPTED_STATUS } from '@tamanu/constants';
import type { TranslatedTextElement } from '../Translations/TranslatedText';

export interface FieldProps {
  component: ReactNode;
  name: string;
  label?: TranslatedTextElement;
  type?: string;
  disabled?: boolean;
  onBlur?: () => void;
  validateOnValueChange?: boolean;
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
  onBlur,
  validateOnValueChange,
  ...rest
}: FieldProps): JSX.Element => {
  const [field, meta, { setValue, setTouched }] = useField(name);
  const { onChange: fieldOnChange } = field;
  const { status, submitCount } = useFormikContext();

  const showError = status === SUBMIT_ATTEMPTED_STATUS || submitCount > 0;
  const error = showError ? meta.error : null;

  const combinedOnChange = useCallback(
    (newValue: any, selectedItem: any): any => {
      onChange?.(newValue, selectedItem);
      // When unset, defer to the form’s `validateOnChange` setting
      if (validateOnValueChange === undefined) {
        return fieldOnChange({ target: { name, value: newValue } });
      }
      return setValue(newValue, validateOnValueChange);
    },
    [fieldOnChange, name, setValue, validateOnValueChange, onChange],
  );

  /**
   * Formik’s own handleBlur expects a DOM event with target.name, which React Native components
   * don’t produce. Mark touched instead, which validates when the form’s set to `validateOnBlur`.
   */
  const augmentedOnBlur = useCallback((): void => {
    onBlur?.();
    setTouched(true);
  }, [setTouched, onBlur]);

  return (
    <FormikField
      as={component}
      name={name}
      onChange={combinedOnChange}
      onBlur={augmentedOnBlur}
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
