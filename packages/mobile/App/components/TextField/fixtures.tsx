import React, { useState } from 'react';
import { DateTextField } from './DateTextField';
import { TextField } from './TextField';
import { MaskedTextField } from './MaskedTextField';
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
      onChangeText={onChangeText}
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
  const onChangeText = (newText: string) => {
    setText(newText);
  };
  return (
    <MaskedTextField
      maskType={maskType}
      options={options}
      label={label}
      value={text}
      error={error}
      onChangeText={onChangeText}
    />
  );
}

interface BaseDateTextFieldStory {
  label: string;
  error?: string;
  dateFormat: string;
}

export function BaseDateTextFieldStory({
  label,
  error,
  dateFormat,
}: BaseDateTextFieldStory) {
  const [date, setDate] = useState<Date | null>(null);
  const onChangeDate = (newDate: Date) => {
    setDate(newDate);
  };
  return (
    <DateTextField
      dateFormat={dateFormat}
      label={label}
      value={date}
      error={error}
      onChange={onChangeDate}
    />
  );
}
