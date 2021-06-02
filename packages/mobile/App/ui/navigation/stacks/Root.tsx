import React, { ReactElement } from 'react';
import { Root } from 'popup-ui';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { DefaultTheme, Provider as PaperProvider } from 'react-native-paper';
import { ThemeProvider } from 'styled-components/native';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { themeSystem } from '/styled/common';
import { store, persistor } from '/store/index';
import { AuthProvider } from '~/ui/contexts/AuthContext';
import { LocalisationProvider } from '~/ui/contexts/LocalisationContext';
import { Core } from './Core';
import { theme } from '../../styled/theme';

const paperTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: theme.colors.PRIMARY_MAIN,
    accent: theme.colors.SECONDARY_MAIN,
  },
};

export const RootStack = (): ReactElement => {
  const navigationRef = React.useRef<NavigationContainerRef>(null);
  return (
    <SafeAreaProvider>
      <Root>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <ThemeProvider theme={themeSystem}>
              <PaperProvider theme={paperTheme}>
                <NavigationContainer ref={navigationRef}>
                  <LocalisationProvider>
                    <AuthProvider navRef={navigationRef}>
                      <Core />
                    </AuthProvider>
                  </LocalisationProvider>
                </NavigationContainer>
              </PaperProvider>
            </ThemeProvider>
          </PersistGate>
        </Provider>
      </Root>
    </SafeAreaProvider>
  )
};
