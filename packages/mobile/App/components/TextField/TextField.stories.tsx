import React, { useState } from 'react';
import { storiesOf } from '@storybook/react-native';
import TextField from './TextField';
import CenterView from '../CenterView';
import { SafeAreaView } from 'react-native';

const stories = storiesOf('TextField', module);

stories.addDecorator((getStory: Function) => (
  <CenterView>{getStory()}</CenterView>
));

interface BaseStoryProps {
  label: string;
  placeholder?: string;
  error?: string;
  isOpen?: boolean;
  required?: boolean;
}

function BaseStory({ label, error }: BaseStoryProps) {
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

stories.add('Active', () => <BaseStory label="First Year of Registration" />);
stories.add('With Error', () => (
  <BaseStory label="First Year of Registration" error={' with error '} />
));
stories.add('Label movement', () => (
  <SafeAreaView style={{ width: '100%' }}>
    <BaseStory label="First Year of Registration" />
    <BaseStory label="Gender" />
  </SafeAreaView>
));
