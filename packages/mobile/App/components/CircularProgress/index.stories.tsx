import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { BaseStory } from './fixture';
import { CenterView } from '../../styled/common';
import { theme } from '../../styled/theme';

storiesOf('CircularProgress', module)
  .addDecorator((story: Function) => (
    <CenterView background={theme.colors.MAIN_SUPER_DARK}>{story()}</CenterView>
  ))
  .add('uploading', () => <BaseStory />);
