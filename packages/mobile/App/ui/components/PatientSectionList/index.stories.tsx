import { CenterView, themeSystem } from '/styled/common';
import { storiesOf } from '@storybook/react-native';
import React from 'react';
import { ThemeProvider } from 'styled-components';
import { BaseStory } from './fixture';

storiesOf('PatientSectionList', module)
  .addDecorator((story: Function) => (
    <ThemeProvider theme={themeSystem}>
      <CenterView width="100%">{story()}</CenterView>
    </ThemeProvider>
  ))
  .add('common', () => <BaseStory />);
