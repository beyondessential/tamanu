import React, { useState } from 'react';
import { storiesOf } from '@storybook/react-native';
import MaskedTextField from './index';
import { CenterView } from '../../styled/common';
import {
  TextInputMaskOptionProp,
  TextInputMaskTypeProp,
} from 'react-native-masked-text';

const stories = storiesOf('MaskedInput', module);

stories.addDecorator((getStory: Function) => (
  <CenterView>{getStory()}</CenterView>
));

interface BaseStoryProps {
  label: string;
  error?: string;
  options?: TextInputMaskOptionProp;
  maskType: TextInputMaskTypeProp;
}

export function BaseStory({ label, error, options, maskType }: BaseStoryProps) {
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
stories.add('Phone', () => (
  <BaseStory
    options={{
      mask: '9999 9999 999',
    }}
    maskType="custom"
    label="Phone"
  />
));
stories.add('With Error', () => (
  <BaseStory
    error={'invalid'}
    options={{
      unit: '$',
      delimiter: ',',
      separator: '.',
    }}
    maskType="money"
    label="Total"
  />
));

stories.add('Currency', () => (
  <BaseStory
    options={{
      unit: '$',
      delimiter: ',',
      separator: '.',
    }}
    maskType="money"
    label="Total"
  />
));
