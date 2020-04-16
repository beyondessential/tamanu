import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { CenterView } from '/styled/common';
import { BaseStory } from './fixture';

storiesOf('PatientMenuButton', module)
  .addDecorator((story: Function) => <CenterView>{story()}</CenterView>)
  .add('List', () => <BaseStory />);
