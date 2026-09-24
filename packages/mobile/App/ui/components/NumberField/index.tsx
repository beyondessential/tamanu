import React, { useState } from 'react';
import type { ReturnKeyTypeOptions } from 'react-native';
import type { BaseInputProps } from '../../interfaces/BaseInputProps';
import { TextField } from '../TextField/TextField';

export interface NumberFieldProps extends BaseInputProps {
  label: string;
  required?: boolean;
  value?: string | number;
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
  labelColor?: string;
  labelFontSize?: string | number;
  fieldFontSize?: string | number;
}

function isEmpty(value: string | number | null | undefined): boolean {
  return value === undefined || value === null || value === '';
}

function toText(value: string | number | null | undefined): string | undefined {
  return isEmpty(value) ? undefined : value.toString();
}

const isEquivalent = (
  text: string | undefined,
  value: string | number | null | undefined,
): boolean => {
  if (isEmpty(value)) return isEmpty(text);
  if (isEmpty(text)) return false;
  return parseFloat(text) === Number(value);
};

export const NumberField = ({ onChange, value, ...props }: NumberFieldProps) => {
  const [typedText, setTypedText] = useState(() => toText(value));
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    // The parent holds a parsed number. If it matches what was typed, it is just echoing our own
    // input back, so keep the raw text (e.g. `1.`). Otherwise the parent changed the value.
    if (!isEquivalent(typedText, value)) setTypedText(toText(value));
  }

  const onChangeNumber = (next: string): void => {
    const value = Number.parseFloat(next);
    if (Number.isNaN(value)) {
      setTypedText(undefined);
      onChange?.('');
    } else {
      setTypedText(next);
      onChange?.(value);
    }
  };

  return (
    <TextField
      keyboardType="numeric"
      onChange={onChangeNumber}
      value={typedText ?? ''}
      {...props}
    />
  );
};
