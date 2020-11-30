import React, { ReactElement } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from 'styled-components/native';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { themeSystem } from '/styled/common';
import { store, persistor } from '/store/index';
import { AuthProvider } from '/contexts/authContext/AuthContext';
import { Core } from './Core';
import { updateScreenOrientation } from '~/ui/helpers/orientation';

type MinimalState = {
  routes: {
    state?: MinimalState;
    name?: string;
  }[];
  index: number;
}

const getRouteFromNavigationState = (state: MinimalState): string => {
  const newState = state.routes[state.index];
  if (newState.state?.routes) {
    return getRouteFromNavigationState(newState.state);
  }
  return newState.name || '?';
};

const onNavigationStateChange = (newState: MinimalState): void => {
  updateScreenOrientation(getRouteFromNavigationState(newState));
};

const initialState: MinimalState = { routes: [{ name: '/' }], index: 0 };

export const RootStack = (): ReactElement => (
  <SafeAreaProvider>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider theme={themeSystem}>
          <NavigationContainer
            onReady={(): void => onNavigationStateChange(initialState)}
            onStateChange={onNavigationStateChange}
          >
            <AuthProvider>
              <Core />
            </AuthProvider>
          </NavigationContainer>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  </SafeAreaProvider>
);
