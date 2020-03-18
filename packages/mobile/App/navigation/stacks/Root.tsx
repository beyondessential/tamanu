import React, { ReactElement } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from 'styled-components/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { themeSystem } from '/styled/common';
import { store } from '/store/index';
import { Core } from './Core';


export const RootStack = (): ReactElement => (
  <SafeAreaProvider>
    <Provider store={store}>
      <ThemeProvider theme={themeSystem}>
        <NavigationContainer>
          <Core />
        </NavigationContainer>
      </ThemeProvider>
    </Provider>
  </SafeAreaProvider>
);
