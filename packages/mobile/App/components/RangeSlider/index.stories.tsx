import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { CenterView } from '../../styled/common';
import { BaseStory } from './fixture';
import { theme } from '../../styled/theme';

storiesOf('RangeSlider', module)
  .addDecorator((story: Function) => (
    <CenterView background={theme.colors.LIGHT_BLUE}>{story()}</CenterView>
  ))
  .add('AgeRangeSlider', () => <BaseStory />);
