import { CenterView } from '/styled/common';
import { storiesOf } from '@storybook/react-native';
import React from 'react';
import { BaseStory } from './fixture';

storiesOf('PatientMenuButton', module)
  .addDecorator((story: Function) => <CenterView>{story()}</CenterView>)
  .add('List', () => <BaseStory />);
