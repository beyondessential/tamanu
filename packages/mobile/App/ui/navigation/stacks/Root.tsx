import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { Root } from 'popup-ui';
import React, { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { AuthProvider } from '../../contexts/AuthContext';
import { FacilityProvider } from '../../contexts/FacilityContext';
import { LocalisationProvider } from '../../contexts/LocalisationContext';
import { persistor, store } from '../../store/index';
import { Core } from './Core';
import { DetectIdleLayer } from './DetectIdleLayer';

export const RootStack = (): ReactElement => {
  const navigationRef = React.useRef<NavigationContainerRef>(null);
  return (
    <SafeAreaProvider>
      <Root>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <NavigationContainer ref={navigationRef}>
              <LocalisationProvider>
                <AuthProvider navRef={navigationRef}>
                  <FacilityProvider>
                    <DetectIdleLayer>
                      <Core />
                    </DetectIdleLayer>
                  </FacilityProvider>
                </AuthProvider>
              </LocalisationProvider>
            </NavigationContainer>
          </PersistGate>
        </Provider>
      </Root>
    </SafeAreaProvider>
  );
};
