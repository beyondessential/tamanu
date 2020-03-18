import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { ThemeProvider } from 'styled-components';
import { CenterView, themeSystem } from '/styled/common';
import { KeyboardAwareView } from '../KeyboardAwareView';
import { BaseDateTextFieldStory } from './fixtures';

const stories = storiesOf('DateTextField', module);

stories.addDecorator((getStory: Function) => (
  <ThemeProvider theme={themeSystem}>
    <KeyboardAwareView>
      <CenterView>{getStory()}</CenterView>
    </KeyboardAwareView>
  </ThemeProvider>
));
stories.add('Active DatePicker', () => (
  <BaseDateTextFieldStory mode="date" label="First Year of Registration" />
));

stories.add('Active TimePicker', () => (
  <BaseDateTextFieldStory mode="time" label="Hour of Registration" />
));

stories.add('With Error', () => (
  <BaseDateTextFieldStory mode="date" label="Date" error=" with error " />
));
