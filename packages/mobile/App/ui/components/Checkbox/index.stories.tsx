import { CenterView } from '/styled/common';
import { theme } from '/styled/theme';
import { storiesOf } from '@storybook/react-native';
import React from 'react';
import { BaseStory } from './fixture';

storiesOf('Checkbox', module)
  .addDecorator((story: Function) => (
    <CenterView flex={1} background={theme.colors.BACKGROUND_GREY}>
      {story()}
    </CenterView>
  ))
  .add('basic', () => <BaseStory />);
