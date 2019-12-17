import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { KeyboardAwareView } from '../KeyboardAwareView';
import { StyledSafeAreaView, CenterView } from '../../styled/common';
import theme from '../../styled/theme';
import { BaseStory } from './fixture';

storiesOf('SearchInput', module)
  .addDecorator((story: Function) => (
    <KeyboardAwareView>
      <CenterView
        height="100%"
        width="100%"
        background={theme.colors.PRIMARY_MAIN}
      >
        {story()}
      </CenterView>
    </KeyboardAwareView>
  ))
  .add('Common', () => <BaseStory />);
