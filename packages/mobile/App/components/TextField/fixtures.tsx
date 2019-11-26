import React, { useState } from 'react';
import { TextField } from './TextField';
import {
  TextInputMaskOptionProp,
  TextInputMaskTypeProp,
} from 'react-native-masked-text';
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

export function BaseStory({
  label,
  error,
  masked,
  maskType,
  options,
}: BaseStoryProps) {
  const [text, setText] = useState('');
  const onChangeText = (newText: string) => {
    setText(newText);
  };
  return (
    <TextField
      masked={masked}
      maskType={maskType}
      options={options}
      label={label}
      value={text}
      error={error}
      onChangeText={onChangeText}
    />
  );
}
