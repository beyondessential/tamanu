import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from 'styled-components/native';
import { themeSystem } from '../../styled/common';
import { Core } from './Core';

export const RootStack = () => (
  <ThemeProvider theme={themeSystem}>
    <NavigationContainer>
      <Core />
    </NavigationContainer>
  </ThemeProvider>
);
