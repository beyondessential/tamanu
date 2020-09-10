import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { KeyboardAwareView } from '../KeyboardAwareView';
import { CenterView } from '/styled/common';
import { NumberField } from './index';

const stories = storiesOf('NumberField', module);

stories.addDecorator(
  (getStory: Function): Element => (
    <KeyboardAwareView>
      <CenterView>{getStory()}</CenterView>
    </KeyboardAwareView>
  ),
);

stories.add('Active', (): Element => <NumberField label="Weight in kg" />);
stories.add(
  'With Error',
  (): Element => <NumberField label="Weight in kg" error=" with error" />,
);
