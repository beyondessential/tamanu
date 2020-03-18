import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { KeyboardAwareView } from '/components/KeyboardAwareView';
import { CenterView } from '/styled/common';
import { BaseTextFieldStory } from './fixtures';

const stories = storiesOf('TextField', module);

stories.addDecorator(
  (getStory: Function): JSX.Element => (
    <KeyboardAwareView>
      <CenterView>{getStory()}</CenterView>
    </KeyboardAwareView>
  ),
);

stories.add(
  'Active',
  (): JSX.Element => <BaseTextFieldStory label="First Year of Registration" />,
);
stories.add(
  'With Error',
  (): JSX.Element => (
    <BaseTextFieldStory
      label="First Year of Registration"
      error=" with error"
    />
  ),
);
stories.add('Multiline', (): JSX.Element => <BaseTextFieldStory multiline />);
