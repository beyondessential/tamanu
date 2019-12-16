import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { StyledView, CenterView } from '../../styled/common';
import { BaseStory } from './fixture';
import { KeyboardAwareView } from '../KeyboardAwareView';
import theme from '../../styled/theme';

storiesOf('Dropdown', module)
  .addDecorator((story: Function) => (
    <KeyboardAwareView>
      <CenterView
        height={'100%'}
        width={'100%'}
        background={theme.colors.WHITE}>
        {story()}
      </CenterView>
    </KeyboardAwareView>
  ))
  .add('common', () => <BaseStory />);
