import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { KeyboardAwareView } from '../KeyboardAwareView';
import { CenterView } from '../../styled/common';
import { BaseStory } from './fixtures';

const stories = storiesOf('TextField', module);

stories.addDecorator((getStory: Function) => (
  <KeyboardAwareView>
    <CenterView>{getStory()}</CenterView>
  </KeyboardAwareView>
));

stories.add('Active', () => <BaseStory label="First Year of Registration" />);
stories.add('With Error', () => (
  <BaseStory label="First Year of Registration" error={' with error '} />
));
