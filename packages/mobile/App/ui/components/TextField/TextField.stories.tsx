import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { KeyboardAwareView } from '../KeyboardAwareView';
import { CenterView } from '/styled/common';
import { BaseTextFieldStory } from './fixtures';

const stories = storiesOf('TextField', module);

stories.addDecorator(
  (getStory: Function): Element => (
    <KeyboardAwareView>
      <CenterView>{getStory()}</CenterView>
    </KeyboardAwareView>
  ),
);

stories.add(
  'Active',
  (): Element => <BaseTextFieldStory label="First Year of Registration" />,
);
stories.add(
  'With Error',
  (): Element => (
    <BaseTextFieldStory
      label="First Year of Registration"
      error=" with error"
    />
  ),
);
stories.add('Multiline', (): Element => <BaseTextFieldStory multiline />);
