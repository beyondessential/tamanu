import React from 'react';
import { storiesOf } from '@storybook/react-native';

import { KeyboardAwareView } from '../KeyboardAwareView';
import { CenterView } from '../../styled/common';
import { BaseStory } from './fixtures';

const stories = storiesOf('MaskedInput', module);

stories.addDecorator((getStory: Function) => (
  <KeyboardAwareView>
    <CenterView>{getStory()}</CenterView>
  </KeyboardAwareView>
));

stories.add('Phone', () => (
  <BaseStory
    masked
    options={{
      mask: '9999 9999 999',
    }}
    maskType="custom"
    label="Phone"
  />
));
stories.add('With Error', () => (
  <BaseStory
    masked
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
    masked
    options={{
      unit: '$',
      delimiter: ',',
      separator: '.',
    }}
    maskType="money"
    label="Total"
  />
));
