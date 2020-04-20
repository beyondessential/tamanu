import React, { useState } from 'react';
import {
  TextInputMaskOptionProp,
  TextInputMaskTypeProp,
} from 'react-native-masked-text';
import { TextField } from './TextField';
import { MaskedTextField } from './MaskedTextField';
interface BaseStoryProps {
  label?: string;
  placeholder?: string;
  error?: string;
  isOpen?: boolean;
  required?: boolean;
  masked?: boolean;
  options?: TextInputMaskOptionProp;
  maskType?: TextInputMaskTypeProp;
  multiline?: boolean;
}

export function BaseTextFieldStory({
  label,
  error,
  multiline,
}: BaseStoryProps): JSX.Element {
  const [text, setText] = useState('');
  const onChangeText = (newText: string): void => {
    setText(newText);
  };
  return (
    <TextField
      label={label}
      value={text}
      error={error}
      onChange={onChangeText}
      multiline={multiline}
    />
  );
}

export function BaseMaskedTextFieldStory({
  label,
  error,
  maskType,
  options,
}: BaseStoryProps): JSX.Element {
  const [text, setText] = useState('');
  const onChange = (newText: string): void => {
    setText(newText);
  };
  return (
    <MaskedTextField
      maskType={maskType}
      options={options}
      label={label}
      value={text}
      error={error}
      onChange={onChange}
    />
  );
}
