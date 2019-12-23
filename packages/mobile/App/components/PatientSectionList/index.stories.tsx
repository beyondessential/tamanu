import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { ThemeProvider } from 'styled-components';
import { BaseStory } from './fixture';
import { CenterView, themeSystem } from '../../styled/common';

storiesOf('PatientSectionList', module)
  .addDecorator((story: Function) => (
    <ThemeProvider theme={themeSystem}>
      <CenterView width="100%">{story()}</CenterView>
    </ThemeProvider>
  ))
  .add('common', () => <BaseStory />);
