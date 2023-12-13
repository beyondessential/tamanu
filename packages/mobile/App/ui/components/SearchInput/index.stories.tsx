import { CenterView } from '/styled/common';
import { theme } from '/styled/theme';
import { storiesOf } from '@storybook/react-native';
import React from 'react';
import { KeyboardAwareView } from '../KeyboardAwareView';
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
