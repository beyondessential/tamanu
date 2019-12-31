import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { ThemeProvider } from 'styled-components';
import { SectionHeader } from './index';
import { CenterView, StyledView, themeSystem } from '../../styled/common';
import { BaseTextFieldStory } from '../TextField/fixtures';

storiesOf('SectionHeader', module)
  .addDecorator((story: Function) => (
    <ThemeProvider theme={themeSystem}>
      <CenterView>{story()}</CenterView>
    </ThemeProvider>
  ))
  .add('h1', () => (
    <StyledView>
      <SectionHeader h1>General Information</SectionHeader>
    </StyledView>
  ))
  .add('h2', () => (
    <StyledView width="100%" paddingLeft={8} paddingRight={8}>
      <SectionHeader h2 marginBottom={10}>
        INFORMATION
      </SectionHeader>
      <BaseTextFieldStory label="Number of Pregnancies" />
      <BaseTextFieldStory label="Number Live Births" />
      <BaseTextFieldStory label="Contraceptive Method" />
    </StyledView>
  ));
