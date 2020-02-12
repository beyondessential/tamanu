import React, { FunctionComponent } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from 'styled-components';
import { SignUpStack } from './SignUp';
import { themeSystem } from '../../styled/common';

export const Core: FunctionComponent<any> = () => (
  <ThemeProvider theme={themeSystem}>
    <NavigationContainer>
      <SignUpStack />
    </NavigationContainer>
  </ThemeProvider>
);
