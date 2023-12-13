import { CenterView, themeSystem } from '/styled/common';
import { theme } from '/styled/theme';
import { storiesOf } from '@storybook/react-native';
import React from 'react';
import { ThemeProvider } from 'styled-components';
import { KeyboardAwareView } from '../KeyboardAwareView';
import { BaseStory } from './fixture';

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
