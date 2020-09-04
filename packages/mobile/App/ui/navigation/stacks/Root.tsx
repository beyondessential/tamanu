import React, {ReactElement} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {ThemeProvider} from 'styled-components/native';
import {PersistGate} from 'redux-persist/integration/react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Provider} from 'react-redux';
import {themeSystem} from '/styled/common';
import {store, persistor} from '/store/index';
import {AuthProvider} from '/contexts/authContext/AuthContext';
import {Core} from './Core';
import {UserProvider} from '/contexts/UserContext';

export const RootStack = (): ReactElement => (
  <SafeAreaProvider>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider theme={themeSystem}>
          <NavigationContainer>
            <UserProvider>
              <AuthProvider>
                <Core />
              </AuthProvider>
            </UserProvider>
          </NavigationContainer>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  </SafeAreaProvider>
);
