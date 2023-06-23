import React, { useState, useEffect } from 'react';
import { ReturnKeyTypeOptions } from 'react-native';
import { BaseInputProps } from '../../interfaces/BaseInputProps';
import { TextField } from '../TextField/TextField';

export interface NumberFieldProps extends BaseInputProps {
  label: string;
  value?: string;
  onChange?: (text: any) => void;
  isOpen?: boolean;
  placeholder?: '' | string;
  disabled?: boolean;
  error?: string;
  secure?: boolean;
  hints?: boolean;
  returnKeyType?: ReturnKeyTypeOptions;
  autoFocus?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const NumberField = (props: NumberFieldProps): JSX.Element => {
  const {
    isOpen,
    placeholder,
    disabled,
    secure,
    hints,
    returnKeyType,
    autoFocus,
    onFocus,
    onBlur,
    label,
    error,
  } = props;
  const [number, setNumber] = useState(undefined);
  const onChangeNumber = (newNumber: string): void => {
    const value = parseFloat(newNumber);
    if (Number.isNaN(value)) {
      setNumber(undefined);
    } else {
      setNumber(newNumber);
    }

    if (props.onChange) {
      if (Number.isNaN(value)) {
        props.onChange('');
      } else {
        props.onChange(value);
      }
    }
  };

  useEffect((): void => {
    if (props.value !== number) {
      setNumber(props.value);
    }
  }, [props.value]);

  return (
    <TextField
      label={label}
      isOpen={isOpen}
      placeholder={placeholder}
      disabled={disabled}
      secure={secure}
      hints={hints}
      returnKeyType={returnKeyType}
      autoFocus={autoFocus}
      onFocus={onFocus}
      onBlur={onBlur}
      error={error}
      value={number === undefined || number === null ? '' : number.toString()}
      onChange={onChangeNumber}
      keyboardType="numeric"
    />
  );
};
