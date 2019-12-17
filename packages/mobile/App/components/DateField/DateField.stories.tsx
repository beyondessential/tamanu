import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { KeyboardAwareView } from '../KeyboardAwareView';
import { CenterView } from '../../styled/common';
import { BaseDateTextFieldStory } from './fixtures';

const stories = storiesOf('DateTextField', module);

stories.addDecorator((getStory: Function) => (
  <KeyboardAwareView>
    <CenterView>{getStory()}</CenterView>
  </KeyboardAwareView>
));
stories.add('Active', () => (
  <BaseDateTextFieldStory label="First Year of Registration" />
));

stories.add('With Error', () => (
  <BaseDateTextFieldStory label="Date" error=" with error " />
));
