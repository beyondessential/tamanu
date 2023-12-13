import { CenterView } from '/styled/common';
import { theme } from '/styled/theme';
import { storiesOf } from '@storybook/react-native';
import React from 'react';
import { BaseStory } from './fixture';

storiesOf('CircularProgress', module)
  .addDecorator((story: Function) => (
    <CenterView background={theme.colors.MAIN_SUPER_DARK}>{story()}</CenterView>
  ))
  .add('uploading', () => <BaseStory />);
