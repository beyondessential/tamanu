/* eslint-disable react/no-unused-prop-types */
import React, { useState } from 'react';
import { TextField } from './TextField';

interface BaseStoryProps {
  label?: string;
  error?: string;
  multiline?: boolean;
}

const defaultBaseStoryProps = {
  label: '',
  error: '',
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
