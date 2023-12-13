import { CenterView } from '/styled/common';
import { storiesOf } from '@storybook/react-native';
import React from 'react';
import { KeyboardAwareView } from '../KeyboardAwareView';
import { NumberField } from './index';

const stories = storiesOf('NumberField', module);

stories.addDecorator(
  (getStory: Function): JSX.Element => (
    <KeyboardAwareView>
      <CenterView>{getStory()}</CenterView>
    </KeyboardAwareView>
  ),
);

stories.add('Active', (): JSX.Element => <NumberField label="Weight in kg" />);
stories.add(
  'With Error',
  (): JSX.Element => <NumberField label="Weight in kg" error=" with error" />,
);
