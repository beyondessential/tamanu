import React, { ReactElement } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from 'styled-components/native';
import { Provider } from 'react-redux';
import { themeSystem } from '../../styled/common';
import { Core } from './Core';
import { store } from '../../redux/store';

export const RootNavigator = (): ReactElement => (
  <Provider store={store}>
    <ThemeProvider theme={themeSystem}>
      <NavigationContainer>
        <Core />
      </NavigationContainer>
    </ThemeProvider>
  </Provider>
);
