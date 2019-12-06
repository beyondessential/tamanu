import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { KeyboardAwareView } from '../KeyboardAwareView';
import { CenterView } from '../../styled/common';
import { BaseTextFieldStory } from './fixtures';

const stories = storiesOf('TextField', module);

stories.addDecorator((getStory: Function) => (
  <KeyboardAwareView>
    <CenterView>{getStory()}</CenterView>
  </KeyboardAwareView>
));

stories.add('Active', () => (
  <BaseTextFieldStory label="First Year of Registration" />
));
stories.add('With Error', () => (
  <BaseTextFieldStory
    label="First Year of Registration"
    error={' with error '}
  />
));
