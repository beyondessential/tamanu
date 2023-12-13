import { storiesOf } from '@storybook/react-native';
import React from 'react';

import { CenterView } from '/styled/common';
import { KeyboardAwareView } from '../KeyboardAwareView';
import { BaseMaskedTextFieldStory } from './fixtures';

const stories = storiesOf('MaskedInput', module);

stories.addDecorator(
  (getStory: Function): JSX.Element => (
    <KeyboardAwareView>
      <CenterView>{getStory()}</CenterView>
    </KeyboardAwareView>
  ),
);

stories.add(
  'Phone',
  (): JSX.Element => (
    <BaseMaskedTextFieldStory
      masked
      options={{
        mask: '9999 9999 999',
      }}
      maskType="custom"
      label="Phone"
    />
  ),
);
stories.add(
  'With Error',
  (): JSX.Element => (
    <BaseMaskedTextFieldStory
      masked
      error="invalid"
      options={{
        unit: '$',
        delimiter: ',',
        separator: '.',
      }}
      maskType="money"
      label="Total"
    />
  ),
);

stories.add(
  'Currency',
  (): JSX.Element => (
    <BaseMaskedTextFieldStory
      masked
      options={{
        unit: '$',
        delimiter: ',',
        separator: '.',
      }}
      maskType="money"
      label="Total"
    />
  ),
);
