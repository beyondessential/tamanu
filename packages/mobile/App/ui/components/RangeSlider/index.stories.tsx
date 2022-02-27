import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { CenterView } from '/styled/common';
import { theme } from '/styled/theme';
import { BaseStory } from './fixture';

storiesOf('RangeSlider', module)
  .addDecorator((story: Function) => (
    <CenterView background={theme.colors.LIGHT_BLUE}>{story()}</CenterView>
  ))
  .add('AgeRangeSlider', () => <BaseStory />);
