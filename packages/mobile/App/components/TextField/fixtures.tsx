import React, { useState } from 'react';
import {
  TextInputMaskOptionProp,
  TextInputMaskTypeProp,
} from 'react-native-masked-text';
import { TextField } from './TextField';
import { MaskedTextField } from './MaskedTextField';
interface BaseStoryProps {
  label: string;
  placeholder?: string;
  error?: string;
  isOpen?: boolean;
  required?: boolean;
  masked?: boolean;
  options?: TextInputMaskOptionProp;
  maskType?: TextInputMaskTypeProp;
}

export function BaseTextFieldStory({ label, error }: BaseStoryProps) {
  const [text, setText] = useState('');
  const onChangeText = (newText: string) => {
    setText(newText);
  };
  return (
    <TextField
      label={label}
      value={text}
      error={error}
      onChange={onChangeText}
    />
  );
}

export function BaseMaskedTextFieldStory({
  label,
  error,
  maskType,
  options,
}: BaseStoryProps) {
  const [text, setText] = useState('');
  const onChange = (newText: string) => {
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
