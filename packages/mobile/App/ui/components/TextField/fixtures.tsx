/* eslint-disable react/no-unused-prop-types */
import React, { useState } from 'react';
import {
  TextInputMaskOptionProp,
  TextInputMaskTypeProp,
} from 'react-native-masked-text';
import { TextField } from './TextField';
import { MaskedTextField } from './MaskedTextField';
interface BaseStoryProps {
  label?: string;
  error?: string;
  options?: TextInputMaskOptionProp;
  maskType?: TextInputMaskTypeProp;
  multiline?: boolean;
}

const defaultBaseStoryProps = {
  label: '',
  error: '',
  options: null,
  maskType: null,
  multiline: false,
};

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

BaseTextFieldStory.defaultProps = defaultBaseStoryProps;

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

BaseMaskedTextFieldStory.defaultProps = defaultBaseStoryProps;
