import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { ThemeProvider } from 'styled-components';
import { CenterView, themeSystem } from '/styled/common';
import { theme } from '/styled/theme';
import { BaseStory } from './fixture';
import { KeyboardAwareView } from '../KeyboardAwareView';

storiesOf('Dropdown', module)
  .addDecorator((story: Function) => (
    <ThemeProvider theme={themeSystem}>
      <KeyboardAwareView>
        <CenterView height="100%" width="100%" background={theme.colors.WHITE}>
          {story()}
        </CenterView>
      </KeyboardAwareView>
    </ThemeProvider>
  ))
  .add('common', () => <BaseStory />);
